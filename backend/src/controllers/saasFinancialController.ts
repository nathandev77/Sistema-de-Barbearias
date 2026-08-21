import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SaasFinancialService } from '../services/saasFinancialService';

// ─── Schemas de Validação ──────────────────────────────────────────────
const costSchema = z.object({
  name: z.string().min(2, 'Nome do custo obrigatório').max(100),
  category: z.enum(['infra', 'service', 'marketing', 'other']).default('infra'),
  amount: z.number().min(0, 'Valor não pode ser negativo'),
  isRecurring: z.boolean().default(true),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

const costUpdateSchema = costSchema.partial();

// ─── CRUD: Custos Operacionais do SaaS ────────────────────────────────

export const listCosts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const costs = await SaasFinancialService.listCosts();
    res.json(costs);
  } catch (error) {
    next(error);
  }
};

export const createCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = costSchema.parse(req.body);
    const cost = await SaasFinancialService.createCost(data);
    res.status(201).json(cost);
  } catch (error) {
    next(error);
  }
};

export const updateCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = costUpdateSchema.parse(req.body);
    const cost = await SaasFinancialService.updateCost(id, data);
    res.json(cost);
  } catch (error) {
    next(error);
  }
};

export const deleteCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await SaasFinancialService.deleteCost(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ─── Métricas Financeiras Avançadas ───────────────────────────────────

export const getFinancialMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const metrics = await SaasFinancialService.getFinancialMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};
