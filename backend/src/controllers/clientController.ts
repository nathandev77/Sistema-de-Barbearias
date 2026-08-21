import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional()
});

export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = clientSchema.parse(req.body);
    const client = await prisma.client.create({ data: { ...data, tenantId: req.user!.tenantId } });
    res.status(201).json(client);
  } catch (error) { next(error); }
};

export const listClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, phone: true, email: true, notes: true, createdAt: true }
    });
    res.json(clients);
  } catch (error) { next(error); }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = clientSchema.partial().parse(req.body);
    const client = await prisma.client.findFirst({ where: { id: req.params.id as string, tenantId: req.user!.tenantId } });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    const updated = await prisma.client.update({ where: { id: req.params.id as string }, data });
    res.json(updated);
  } catch (error) { next(error); }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findFirst({ where: { id: req.params.id as string, tenantId: req.user!.tenantId } });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    
    // Excluir registros relacionados para não dar erro de restrição de chave estrangeira
    await prisma.appointment.deleteMany({ where: { clientId: client.id } });
    await prisma.subscription.deleteMany({ where: { clientId: client.id } });
    await prisma.productReservation.deleteMany({ where: { clientId: client.id } });
    
    await prisma.client.delete({ where: { id: client.id } });
    res.status(204).send();
  } catch (error) { next(error); }
};
