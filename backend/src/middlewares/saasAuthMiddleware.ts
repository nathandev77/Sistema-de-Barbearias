import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Timing-safe key verification using SHA-256 hash comparison.
 * Prevents timing attacks regardless of string lengths.
 */
function safeKeyCompare(providedKey: string, actualKey: string): boolean {
  if (!providedKey || !actualKey) return false;
  
  const providedHash = crypto.createHash('sha256').update(providedKey).digest();
  const actualHash = crypto.createHash('sha256').update(actualKey).digest();
  
  return crypto.timingSafeEqual(providedHash, actualHash);
}

export const saasAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const masterKey = req.headers['x-super-admin-key'];

  if (typeof masterKey !== 'string') {
    res.status(401).json({ error: 'Não autorizado. Chave Mestra inválida ou ausente.' });
    return;
  }

  // Permite uma ou múltiplas chaves separadas por vírgula em SUPER_ADMIN_KEYS ou SUPER_ADMIN_KEY
  const configuredKeys = (process.env.SUPER_ADMIN_KEYS || process.env.SUPER_ADMIN_KEY || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  if (configuredKeys.length === 0) {
    res.status(500).json({ error: 'SUPER_ADMIN_KEY não configurada no servidor.' });
    return;
  }

  const isAuthorized = configuredKeys.some(key => safeKeyCompare(masterKey, key));

  if (!isAuthorized) {
    res.status(401).json({ error: 'Não autorizado. Chave Mestra inválida.' });
    return;
  }

  next();
};

