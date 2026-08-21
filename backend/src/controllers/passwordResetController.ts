import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import { redis } from '../redis';
import crypto from 'crypto';
import { emailWithMxValidator, validatePasswordStrength } from '../utils/validators';

/**
 * Initiate password reset by generating OTP and sending it to user's email.
 */
export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    // Validate email format & MX
    await emailWithMxValidator.parseAsync(email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, respond with generic message
      return res.status(200).json({ message: 'Se o email existir, enviamos instruções de redefinição.' });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const key = `pwdreset:${email}`;
    await redis.set(key, { code: otp, attempts: 0 }, 600); // 10 min TTL
    console.log(`[PWD RESET] OTP for ${email}: ${otp}`);
    // TODO: integrate real email service
    return res.status(200).json({ message: 'Se o email existir, enviamos instruções de redefinição.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify the OTP for password reset.
 */
export async function verifyPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios.' });
    }
    const key = `pwdreset:${email}`;
    const data = await redis.get(key);
    if (!data) {
      return res.status(410).json({ error: 'Código expirado ou não encontrado.' });
    }
    if (data.attempts >= 3) {
      await redis.del(key);
      return res.status(429).json({ error: 'Máximo de tentativas excedido. Solicite novo código.' });
    }
    if (data.code !== code) {
      await redis.set(key, { ...data, attempts: data.attempts + 1 }, 600);
      return res.status(401).json({ error: 'Código inválido.' });
    }
    // Mark as verified (store a flag)
    await redis.set(key, { verified: true }, 600);
    return res.status(200).json({ message: 'Código verificado. Pode redefinir a senha.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset the password after successful OTP verification.
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email e nova senha são obrigatórios.' });
    }

    // Validar força da nova senha antes de qualquer operação
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const key = `pwdreset:${email}`;
    const data = await redis.get(key);
    if (!data || !data.verified) {
      return res.status(403).json({ error: 'Código não verificado ou expirado.' });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    await redis.del(key);
    return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    next(err);
  }
}
