import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.number().min(0),
  cost: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: { ...data, tenantId: req.user!.tenantId } });
    res.status(201).json(product);
  } catch (error) { next(error); }
};

export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({ where: { tenantId: req.user!.tenantId }, orderBy: { name: 'asc' } });
    res.json(products);
  } catch (error) { next(error); }
};

const productUpdateSchema = productSchema.partial();

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const data = productUpdateSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id, tenantId: req.user!.tenantId },
      data
    });
    res.json(product);
  } catch (error) { next(error); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.product.delete({
      where: { id, tenantId: req.user!.tenantId }
    });
    res.json({ success: true });
  } catch (error) { next(error); }
};
