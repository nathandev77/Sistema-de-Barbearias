import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { emailWithMxValidator, brazilPhoneValidator, passwordValidator } from '../utils/validators';
import { AuthService } from '../services/authService';

// ==========================================
// SCHEMAS DE VALIDAÇÃO (ZERO TRUST)
// ==========================================

const registerSchema = z.object({
  barbershopName: z.string().min(3, "Nome da barbearia muito curto").max(100, "Nome muito longo"),
  barbershopSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hífens.").optional(),
  ownerName: z.string().min(3, "Nome do dono obrigatório").max(100).optional(),
  email: emailWithMxValidator,
  phone: brazilPhoneValidator.optional(),
  password: passwordValidator.optional(),
});

const trialRegisterSchema = z.object({
  barbershopName: z.string().min(2, "Nome da barbearia deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: emailWithMxValidator,
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  password: z.string().min(1, "A senha é obrigatória")
});

const firstAccessSchema = z.object({
  email: z.string().email("Formato de email inválido"),
  tempPassword: z.string().min(1, "Senha temporária é obrigatória"),
  newPassword: passwordValidator,
});

// ==========================================
// CONTROLLERS
// ==========================================

export const registerTrial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await trialRegisterSchema.parseAsync(req.body);
    const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const result = await AuthService.registerTrial(data, origin);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const firstAccessChangePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await firstAccessSchema.parseAsync(req.body);
    
    const result = await AuthService.firstAccessChangePassword(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const registerTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await registerSchema.parseAsync(req.body);
    const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const result = await AuthService.registerTenant(data, origin);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const result = await AuthService.login(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
