import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]:', err);

  // Validation error handling (Zod)
  if (err && (err.name === 'ZodError' || err instanceof ZodError || err.issues || err.errors)) {
    const issues = err.issues || err.errors || [];
    const firstMsg = issues[0]?.message || 'Invalid input data.';
    return res.status(400).json({
      error: firstMsg,
      details: issues.map((e: any) => ({
        path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message
      }))
    });
  }

  // Prisma error handling
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P2')) {
    return res.status(400).json({
      error: 'Database constraint violated.',
      message: 'The database operation could not be completed.'
    });
  }

  // Other errors
  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({ error: message });
}
