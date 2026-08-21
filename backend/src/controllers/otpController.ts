import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis';
import crypto from 'crypto';

/**
 * Generate a 6‑digit OTP and store it in Redis with a TTL (default 10 minutes).
 * Also tracks the number of validation attempts to enforce lockout after 3 failures.
 */
export async function requestOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ error: 'É necessário email ou telefone para gerar OTP.' });
    }
    const identifier = email || phone;
    const otp = crypto.randomInt(100000, 999999).toString();
    const key = `otp:${identifier}`;
    // Store OTP with TTL 600 seconds (10 min) and reset attempts counter
    await redis.set(key, { code: otp, attempts: 0 }, 600);
    // TODO: Integrate real email/SMS delivery. For now, just log.
    console.log(`[OTP] Código para ${identifier}: ${otp}`);
    return res.status(200).json({ message: 'Código OTP enviado.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify an OTP. Allows up to 3 incorrect attempts before invalidating the code.
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone, code } = req.body;
    const identifier = email || phone;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Email/telefone e código são obrigatórios.' });
    }
    const key = `otp:${identifier}`;
    const data = await redis.get(key);
    if (!data) {
      return res.status(410).json({ error: 'OTP expirado ou não encontrado.' });
    }
    if (data.attempts >= 3) {
      await redis.del(key);
      return res.status(429).json({ error: 'Máximo de tentativas excedido. Solicite novo OTP.' });
    }
    if (data.code !== code) {
      // Increment attempts
      await redis.set(key, { ...data, attempts: data.attempts + 1 }, 600);
      return res.status(401).json({ error: 'Código OTP inválido.' });
    }
    // Successful verification – delete OTP
    await redis.del(key);
    return res.status(200).json({ message: 'OTP verificado com sucesso.' });
  } catch (err) {
    next(err);
  }
}
