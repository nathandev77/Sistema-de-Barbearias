import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { emailWithMxValidator, brazilPhoneValidator, passwordValidator } from '../utils/validators';
import { AuthService } from '../services/authService';

// ==========================================
// VALIDATION SCHEMAS (ZERO TRUST)
// ==========================================

const registerSchema = z.object({
  barbershopName: z.string().min(3, "Barbershop name is too short").max(100, "Name is too long"),
  barbershopSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "The slug must contain only lowercase letters, numbers and hyphens.").optional(),
  ownerName: z.string().min(3, "Owner name is required").max(100).optional(),
  email: emailWithMxValidator,
  phone: brazilPhoneValidator.optional(),
  password: passwordValidator.optional(),
});

const trialRegisterSchema = z.object({
  barbershopName: z.string().min(2, "Barbershop name must be at least 2 characters").max(100, "Name is too long"),
  email: emailWithMxValidator,
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

const firstAccessSchema = z.object({
  email: z.string().email("Invalid email format"),
  tempPassword: z.string().min(1, "Temporary password is required"),
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
