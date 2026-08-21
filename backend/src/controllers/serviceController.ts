import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const serviceInputSchema = z.object({
  name: z.string().min(1, 'Nome do serviço é obrigatório'),
  description: z.string().optional().nullable(),
  price: z.preprocess((v) => Number(v), z.number().min(0)),
  durationMinutes: z.preprocess((v) => (v !== undefined && v !== null && v !== '' ? Number(v) : undefined), z.number().min(1)).optional(),
  duration_minutes: z.preprocess((v) => (v !== undefined && v !== null && v !== '' ? Number(v) : undefined), z.number().min(1)).optional(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
});

const formatService = (s: any) => ({
  ...s,
  durationMinutes: s.durationMinutes && s.durationMinutes > 0 ? s.durationMinutes : 30,
  duration_minutes: s.durationMinutes && s.durationMinutes > 0 ? s.durationMinutes : 30,
  isActive: s.isActive !== false,
  is_active: s.isActive !== false,
});

export const createService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = serviceInputSchema.parse(req.body);
    const duration = raw.durationMinutes ?? raw.duration_minutes ?? 30;
    const active = raw.isActive ?? raw.is_active ?? true;

    const service = await prisma.service.create({ 
      data: {
        name: raw.name,
        description: raw.description || undefined,
        price: raw.price,
        durationMinutes: duration > 0 ? duration : 30,
        isActive: active,
        tenantId: req.user!.tenantId 
      } 
    });
    res.status(201).json(formatService(service));
  } catch (error) { next(error); }
};

export const listServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await prisma.service.findMany({ 
      where: { tenantId: req.user!.tenantId }, 
      orderBy: { name: 'asc' } 
    });
    res.json(services.map(formatService));
  } catch (error) { next(error); }
};

const serviceUpdateSchema = serviceInputSchema.partial();

export const updateService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const raw = serviceUpdateSchema.parse(req.body);

    const updateData: any = {};
    if (raw.name !== undefined) updateData.name = raw.name;
    if (raw.description !== undefined) updateData.description = raw.description || null;
    if (raw.price !== undefined) updateData.price = raw.price;
    
    const duration = raw.durationMinutes ?? raw.duration_minutes;
    if (duration !== undefined) updateData.durationMinutes = duration > 0 ? duration : 30;

    const active = raw.isActive ?? raw.is_active;
    if (active !== undefined) updateData.isActive = active;

    const service = await prisma.service.update({
      where: { id, tenantId: req.user!.tenantId },
      data: updateData
    });
    res.json(formatService(service));
  } catch (error) { next(error); }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.service.delete({
      where: { id, tenantId: req.user!.tenantId }
    });
    res.json({ success: true });
  } catch (error) { next(error); }
};

