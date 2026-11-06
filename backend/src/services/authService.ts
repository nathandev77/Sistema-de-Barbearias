import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { sendTrialWelcomeEmail } from '../utils/mailer';

// ==========================================
// Internal HELPERS
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
   * Registers a Quick Free Trial
   */
  static async registerTrial(data: any, origin: string) {
    // 1. Check whether the email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('This email already has a registered account. Log in to access your barbershop.');
    }

    // 2. Generate a Unique Slug for the Barbershop
    let baseSlug = generateSlug(data.barbershopName);
    if (!baseSlug || baseSlug.length < 2) baseSlug = 'barbearia';
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await prisma.tenant.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // 3. Generate and Hash a Temporary Password
    const tempPassword = generateTempPassword();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // 4. Compute the Trial period (4 days)
    const fourDaysInMs = 4 * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(Date.now() + fourDaysInMs);

    // 5. Atomic Transaction to Create Tenant + Admin User
    const result = await prisma.$transaction(async (tx: any) => {
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

    // 6. Send Email with Credentials
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
      message: 'Free trial account created successfully! We have sent your login details by email.',
      email: data.email,
      barbershopName: data.barbershopName,
      slug: uniqueSlug,
      trialEndsAt,
      loginUrl
    };
  }

  /**
   * Mandatory Password Change on First Access
   */
  static async firstAccessChangePassword(data: any) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true }
    });

    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isTempValid = await bcrypt.compare(data.tempPassword, user.password);
    if (!isTempValid) {
      throw new Error('The temporary password entered is incorrect.');
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
    if (!secret) throw new Error('JWT_SECRET is not configured.');

    const payload = {
      id: updatedUser.id,
      tenantId: updatedUser.tenantId,
      role: updatedUser.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '12h' });

    const now = new Date();
    const isTrial = updatedUser.tenant.subscriptionStatus === 'trial';
    let trialDaysRemaining: number | null = null;
    if (isTrial && updatedUser.tenant.trialEndsAt) {
      const diffMs = new Date(updatedUser.tenant.trialEndsAt).getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      message: 'Password changed successfully! Welcome to your dashboard.',
      token,
      user: userWithoutPassword,
      barbershop: {
        ...updatedUser.tenant,
        trialDaysRemaining
      }
    };
  }

  /**
   * Registers a Full Tenant (SaaS Admin or Sales Panel)
   */
  static async registerTenant(data: any, origin: string) {
    const barbershopSlug = data.barbershopSlug || generateSlug(data.barbershopName);

    const existingTenant = await prisma.tenant.findUnique({ where: { slug: barbershopSlug } });
    if (existingTenant) {
      throw new Error('This link/slug is already in use by another barbershop.');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('This email is already registered.');
    }

    const passwordToUse = data.password || generateTempPassword();
    const mustChange = !data.password;

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(passwordToUse, saltRounds);

    const fourDaysInMs = 4 * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(Date.now() + fourDaysInMs);

    const result = await prisma.$transaction(async (tx: any) => {
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
      message: 'Barbershop and Account created successfully! You have a 4-day free trial.',
      tenant: result.tenant,
      user: userWithoutPassword,
      trialEndsAt,
      tempPassword: mustChange ? passwordToUse : undefined
    };
  }

  /**
   * Centralized Authentication Logic
   */
  static async login(data: any) {
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: { tenant: true }
    });

    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials.');
    }

    if (user.mustChangePassword) {
      return {
        mustChangePassword: true,
        email: user.email,
        message: 'First access detected. You must create your permanent password before continuing.'
      };
    }

    if (!user.tenant.isActive || user.tenant.subscriptionStatus === 'blocked') {
      throw new Error('Access blocked. The barbershop has been suspended by the administrator.');
    }

    const now = new Date();
    const isTrial = user.tenant.subscriptionStatus === 'trial';
    const trialEnded = user.tenant.trialEndsAt ? new Date(user.tenant.trialEndsAt) < now : false;

    if (isTrial && trialEnded) {
      throw new Error('Your 4-day trial period has expired. Choose a plan to keep using Barber Control.');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured.');

    const payload = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '12h' });

    let trialDaysRemaining: number | null = null;
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
