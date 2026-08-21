import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]:', err);

  // Tratamento de erros de validação (Zod)
  if (err && (err.name === 'ZodError' || err instanceof ZodError || err.issues || err.errors)) {
    const issues = err.issues || err.errors || [];
    const firstMsg = issues[0]?.message || 'Dados de entrada inválidos.';
    return res.status(400).json({
      error: firstMsg,
      details: issues.map((e: any) => ({
        path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message
      }))
    });
  }

  // Tratamento de erros do Prisma
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P2')) {
    return res.status(400).json({
      error: 'Restrição de banco de dados violada.',
      message: 'Não foi possível completar a operação no banco de dados.'
    });
  }

  // Outros erros
  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({ error: message });
}
