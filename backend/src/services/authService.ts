import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { sendTrialWelcomeEmail } from '../utils/mailer';

// ==========================================
// HELPERS Internos
// ==========================================
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function generateTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(100 + Math.random() * 900);
  return `Barber@${digits}${rand}!`;
}

// ==========================================
// SERVICE LAYER
// ==========================================
export class AuthService {
  /**
   * Registra um Trial Grátis Rápido
   */
  static async registerTrial(data: any, origin: string) {
    // 1. Verificar se o e-mail já existe
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Este e-mail já possui uma conta cadastrada. Faça login para acessar sua barbearia.');
    }

    // 2. Gerar Slug Único para a Barbearia
    let baseSlug = generateSlug(data.barbershopName);
    if (!baseSlug || baseSlug.length < 2) baseSlug = 'barbearia';
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await prisma.tenant.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // 3. Gerar Senha Temporária e Hashear
    const tempPassword = generateTempPassword();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // 4. Calcular período de Trial (4 dias)
    const fourDaysInMs = 4 * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(Date.now() + fourDaysInMs);

    // 5. Transação Atômica para Criar Tenant + Usuário Admin
    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: data.barbershopName,
          slug: uniqueSlug,
          isActive: true,
          subscriptionStatus: 'trial',
          trialEndsAt: trialEndsAt,
          planType: 'pro'
        }
      });

      const newUser = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: data.barbershopName,
          email: data.email,
          password: hashedPassword,
          role: 'ADMIN',
          mustChangePassword: true
        }
      });

      return { tenant: newTenant, user: newUser };
    });

    // 6. Enviar E-mail com Credenciais
    const loginUrl = `${origin}/admin/login`;

    await sendTrialWelcomeEmail({
      to: data.email,
      barbershopName: data.barbershopName,
      loginEmail: data.email,
      tempPassword: tempPassword,
      loginUrl: loginUrl
    });

    const { password: _, ...userWithoutPassword } = result.user;

    return {
      message: 'Cadastro de teste grátis criado com sucesso! Enviamos seus dados de acesso por e-mail.',
      email: data.email,
      barbershopName: data.barbershopName,
      slug: uniqueSlug,
      trialEndsAt,
      loginUrl
    };
  }

  /**
   * Troca Obrigatória de Senha no Primeiro Acesso
   */
  static async firstAccessChangePassword(data: any) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true }
    });

    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    const isTempValid = await bcrypt.compare(data.tempPassword, user.password);
    if (!isTempValid) {
      throw new Error('A senha temporária digitada está incorreta.');
    }

    const saltRounds = 12;
    const newHashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        mustChangePassword: false
      },
      include: { tenant: true }
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado.');

    const payload = {
      id: updatedUser.id,
      tenantId: updatedUser.tenantId,
      role: updatedUser.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '12h' });

    const now = new Date();
    const isTrial = updatedUser.tenant.subscriptionStatus === 'trial';
    let trialDaysRemaining = null;
    if (isTrial && updatedUser.tenant.trialEndsAt) {
      const diffMs = new Date(updatedUser.tenant.trialEndsAt).getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      message: 'Senha alterada com sucesso! Bem-vindo ao seu painel.',
      token,
      user: userWithoutPassword,
      barbershop: {
        ...updatedUser.tenant,
        trialDaysRemaining
      }
    };
  }

  /**
   * Registra um Tenant Completo (SaaS Admin ou Painel de Vendas)
   */
  static async registerTenant(data: any, origin: string) {
    const barbershopSlug = data.barbershopSlug || generateSlug(data.barbershopName);

    const existingTenant = await prisma.tenant.findUnique({ where: { slug: barbershopSlug } });
    if (existingTenant) {
      throw new Error('Este link/slug já está sendo usado por outra barbearia.');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Este email já está cadastrado.');
    }

    const passwordToUse = data.password || generateTempPassword();
    const mustChange = !data.password;

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(passwordToUse, saltRounds);

    const fourDaysInMs = 4 * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(Date.now() + fourDaysInMs);

    const result = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: data.barbershopName,
          slug: barbershopSlug,
          isActive: true,
          subscriptionStatus: 'trial',
          trialEndsAt: trialEndsAt,
          planType: 'pro'
        }
      });

      const newUser = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: data.ownerName || data.barbershopName,
          email: data.email,
          password: hashedPassword,
          role: 'ADMIN',
          mustChangePassword: mustChange
        }
      });

      return { tenant: newTenant, user: newUser };
    });

    const loginUrl = `${origin}/admin/login`;

    await sendTrialWelcomeEmail({
      to: data.email,
      barbershopName: data.barbershopName,
      loginEmail: data.email,
      tempPassword: passwordToUse,
      loginUrl
    });

    const { password: _, ...userWithoutPassword } = result.user;

    return {
      message: 'Barbearia e Conta criadas com sucesso! Você tem 4 dias de teste grátis.',
      tenant: result.tenant,
      user: userWithoutPassword,
      trialEndsAt,
      tempPassword: mustChange ? passwordToUse : undefined
    };
  }

  /**
   * Lógica de Autenticação Centralizada
   */
  static async login(data: any) {
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: { tenant: true }
    });

    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas.');
    }

    if (user.mustChangePassword) {
      return {
        mustChangePassword: true,
        email: user.email,
        message: 'Primeiro acesso detectado. É obrigatório criar sua senha definitiva antes de prosseguir.'
      };
    }

    if (!user.tenant.isActive || user.tenant.subscriptionStatus === 'blocked') {
      throw new Error('Acesso bloqueado. A barbearia encontra-se suspensa pelo administrador.');
    }

    const now = new Date();
    const isTrial = user.tenant.subscriptionStatus === 'trial';
    const trialEnded = user.tenant.trialEndsAt ? new Date(user.tenant.trialEndsAt) < now : false;

    if (isTrial && trialEnded) {
      throw new Error('Seu período de teste de 4 dias expirou. Escolha um plano para continuar utilizando o Barber Control.');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado.');

    const payload = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '12h' });

    let trialDaysRemaining = null;
    if (isTrial && user.tenant.trialEndsAt) {
      const diffMs = new Date(user.tenant.trialEndsAt).getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
      barbershop: {
        ...user.tenant,
        trialDaysRemaining
      }
    };
  }
}
