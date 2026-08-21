import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estende a interface Request do Express para incluir os dados do usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        role: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Extrai o token do header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido ou inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verifica e decodifica o token usando a chave secreta do servidor
    // Se o frontend tentar falsificar isso, o JWT vai falhar criptograficamente.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Configuração interna inválida.' });
    }
    const decoded = jwt.verify(token, secret) as { id: string; tenantId: string; role: string };

    // 3. Injeta os dados seguros na requisição.
    // NUNCA confiaremos no tenantId enviado no body da requisição,
    // usaremos EXCLUSIVAMENTE este tenantId validado pelo token.
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token expirado ou corrompido.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente para esta ação.' });
    }
    next();
  };
}
