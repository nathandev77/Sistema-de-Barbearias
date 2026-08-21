import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { emailWithMxValidator, brazilPhoneValidator, passwordValidator } from '../utils/validators';
import { prisma } from '../prisma';
import { sendTrialWelcomeEmail } from '../utils/mailer';

// ==========================================
// SCHEMAS DE VALIDAÇÃO (ZERO TRUST)
// ==========================================

// Validação de Registro Completo
const registerSchema = z.object({
  barbershopName: z.string().min(3, "Nome da barbearia muito curto").max(100, "Nome muito longo"),
  barbershopSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hífens.").optional(),
  ownerName: z.string().min(3, "Nome do dono obrigatório").max(100).optional(),
  email: emailWithMxValidator,
  phone: brazilPhoneValidator.optional(),
  password: passwordValidator.optional(),
});

// Validação para Início Rápido de Teste Grátis (Nome da Barbearia + Email)
const trialRegisterSchema = z.object({
  barbershopName: z.string().min(2, "Nome da barbearia deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: emailWithMxValidator,
  phone: z.string().optional(),
});

// Validação de Login
const loginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(1, "A senha é obrigatória")
});

// Validação de Troca de Senha no Primeiro Acesso
const firstAccessSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  tempPassword: z.string().min(1, "Senha temporária é obrigatória"),
  newPassword: passwordValidator,
});

// Helpers
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
// CONTROLLERS
// ==========================================

/**
 * Registro de Teste Grátis Rápido:
 * - O cliente informa o Nome da Barbearia e o E-mail.
 * - O sistema cria o tenant com 4 dias grátis.
 * - Gera uma senha temporária segura e marca `mustChangePassword = true`.
 * - Dispara um e-mail com as credenciais e o link de acesso.
 */
export const registerTrial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await trialRegisterSchema.parseAsync(req.body);

    // 1. Verificar se o e-mail já existe
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Este e-mail já possui uma conta cadastrada. Faça login para acessar sua barbearia.' 
      });
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

    // 5. Transação Atômica para Criar Tenant + Usuário Admin com mustChangePassword = true
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
    const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${origin}/admin/login`;

    await sendTrialWelcomeEmail({
      to: data.email,
      barbershopName: data.barbershopName,
      loginEmail: data.email,
      tempPassword: tempPassword,
      loginUrl: loginUrl
    });

    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({
      message: 'Cadastro de teste grátis criado com sucesso! Enviamos seus dados de acesso por e-mail.',
      email: data.email,
      barbershopName: data.barbershopName,
      slug: uniqueSlug,
      trialEndsAt,
      loginUrl
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Troca Obrigatória de Senha no Primeiro Acesso
 */
export const firstAccessChangePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await firstAccessSchema.parseAsync(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Validar a senha temporária atual
    const isTempValid = await bcrypt.compare(data.tempPassword, user.password);
    if (!isTempValid) {
      return res.status(401).json({ error: 'A senha temporária digitada está incorreta.' });
    }

    // Hashear a nova senha definida pelo usuário
    const saltRounds = 12;
    const newHashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

    // Atualizar no banco e remover flag mustChangePassword
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        mustChangePassword: false
      },
      include: { tenant: true }
    });

    // Gerar JWT e logar diretamente
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

    res.json({
      message: 'Senha alterada com sucesso! Bem-vindo ao seu painel.',
      token,
      user: userWithoutPassword,
      barbershop: {
        ...updatedUser.tenant,
        trialDaysRemaining
      }
    });

  } catch (error) {
    next(error);
  }
};

export const registerTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await registerSchema.parseAsync(req.body);

    const barbershopSlug = data.barbershopSlug || generateSlug(data.barbershopName);

    const existingTenant = await prisma.tenant.findUnique({ where: { slug: barbershopSlug } });
    if (existingTenant) {
      return res.status(409).json({ error: 'Este link/slug já está sendo usado por outra barbearia.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está cadastrado.' });
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

    const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${origin}/admin/login`;

    await sendTrialWelcomeEmail({
      to: data.email,
      barbershopName: data.barbershopName,
      loginEmail: data.email,
      tempPassword: passwordToUse,
      loginUrl
    });

    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({
      message: 'Barbearia e Conta criadas com sucesso! Você tem 4 dias de teste grátis.',
      tenant: result.tenant,
      user: userWithoutPassword,
      trialEndsAt,
      tempPassword: mustChange ? passwordToUse : undefined
    });

  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validar input
    const data = loginSchema.parse(req.body);

    // 2. Buscar usuário
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: { tenant: true } // Traz os dados da barbearia vinculada
    });

    // ANTI-ENUMERAÇÃO DE CONTAS:
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 3. Comparação de senha em tempo constante
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 4. Se for primeiro acesso com senha provisória, exigir a troca de senha
    if (user.mustChangePassword) {
      return res.status(200).json({
        mustChangePassword: true,
        email: user.email,
        message: 'Primeiro acesso detectado. É obrigatório criar sua senha definitiva antes de prosseguir.'
      });
    }

    // 5. Verificar se a barbearia não foi desativada manualmente
    if (!user.tenant.isActive || user.tenant.subscriptionStatus === 'blocked') {
      return res.status(403).json({ 
        code: 'ACCOUNT_BLOCKED',
        error: 'Acesso bloqueado. A barbearia encontra-se suspensa pelo administrador.' 
      });
    }

    // 6. Verificar expiração de Trial de 4 dias
    const now = new Date();
    const isTrial = user.tenant.subscriptionStatus === 'trial';
    const trialEnded = user.tenant.trialEndsAt ? new Date(user.tenant.trialEndsAt) < now : false;

    if (isTrial && trialEnded) {
      return res.status(403).json({
        code: 'TRIAL_EXPIRED',
        error: 'Seu período de teste de 4 dias expirou. Escolha um plano para continuar utilizando o Barber Control.',
        barbershop: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          trialEndsAt: user.tenant.trialEndsAt
        }
      });
    }

    // 7. Geração Segura do JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado.');

    const payload = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '12h' });

    // Calcular dias restantes de trial
    let trialDaysRemaining = null;
    if (isTrial && user.tenant.trialEndsAt) {
      const diffMs = new Date(user.tenant.trialEndsAt).getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
      barbershop: {
        ...user.tenant,
        trialDaysRemaining
      }
    });

  } catch (error) {
    next(error);
  }
};
