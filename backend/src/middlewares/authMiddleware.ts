import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extends Express's Request interface to include the authenticated user's data
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
  // 1. Extract the token from the header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Token missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify and decode the token using the server's secret key
    // If the frontend tries to forge this, the JWT will fail cryptographically.
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Invalid internal configuration.' });
    }
    const decoded = jwt.verify(token, secret) as { id: string; tenantId: string; role: string };

    // 3. Inject the secure data into the request.
    // We will NEVER trust the tenantId sent in the request body,
    // we will use EXCLUSIVELY this tenantId validated by the token.
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token expired or corrupted.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permission for this action.' });
    }
    next();
  };
}
