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
      return res.status(400).json({ error: 'Email or phone is required to generate an OTP.' });
    }
    const identifier = email || phone;
    const otp = crypto.randomInt(100000, 999999).toString();
    const key = `otp:${identifier}`;
    // Store OTP with TTL 600 seconds (10 min) and reset attempts counter
    await redis.set(key, { code: otp, attempts: 0 }, 600);
    // TODO: Integrate real email/SMS delivery. For now, just log.
    console.log(`[OTP] Code for ${identifier}: ${otp}`);
    return res.status(200).json({ message: 'OTP code sent.' });
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
      return res.status(400).json({ error: 'Email/phone and code are required.' });
    }
    const key = `otp:${identifier}`;
    const data = await redis.get(key);
    if (!data) {
      return res.status(410).json({ error: 'OTP expired or not found.' });
    }
    if (data.attempts >= 3) {
      await redis.del(key);
      return res.status(429).json({ error: 'Maximum attempts exceeded. Request a new OTP.' });
    }
    if (data.code !== code) {
      // Increment attempts
      await redis.set(key, { ...data, attempts: data.attempts + 1 }, 600);
      return res.status(401).json({ error: 'Invalid OTP code.' });
    }
    // Successful verification – delete OTP
    await redis.del(key);
    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    next(err);
  }
}
