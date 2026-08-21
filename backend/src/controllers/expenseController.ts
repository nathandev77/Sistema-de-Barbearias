import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const expenseSchema = z.object({
  description: z.string().min(2),
  category: z.string().min(2),
  amount: z.number().min(0.01),
  date: z.string(), // YYYY-MM-DD
  isRecurring: z.boolean().default(false)
});

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data: { ...data, tenantId: req.user!.tenantId } });
    res.status(201).json(expense);
  } catch (error) { next(error); }
};

export const listExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expenses = await prisma.expense.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (error) { next(error); }
};

const expenseUpdateSchema = expenseSchema.partial();

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const data = expenseUpdateSchema.parse(req.body);
    const expense = await prisma.expense.update({
      where: { id, tenantId: req.user!.tenantId },
      data
    });
    res.json(expense);
  } catch (error) { next(error); }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.expense.delete({
      where: { id, tenantId: req.user!.tenantId }
    });
    res.json({ success: true });
  } catch (error) { next(error); }
};
