import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

// Esquema de Validação Zod (Zero Trust)
// Tudo que vem do Frontend passa por este funil implacável.
const createBarberSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  compensationType: z.enum(['commission', 'fixed', 'both']),
  commissionPct: z.number().min(0).max(100).default(0),
  fixedSalary: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  workStart: z.string().default('09:00'),
  workEnd: z.string().default('18:00'),
  lunchStart: z.string().optional().nullable(),
  lunchEnd: z.string().optional().nullable(),
  notes: z.string().optional()
});

export const createBarber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Zod filtra e recusa qualquer lixo ou dado perigoso enviado pelo frontend
    const validatedData = createBarberSchema.parse(req.body);

    // 2. Extrai o tenantId com base EXCLUSIVA no token JWT (req.user), 
    // ignorando totalmente se o frontend tentar enviar um tenantId falso.
    const tenantId = req.user!.tenantId;

    // 3. Regra de Negócio Segura no Backend: 
    // Garante coerência entre comissão e salário fixo.
    let { commissionPct, fixedSalary, compensationType } = validatedData;
    if (compensationType === 'fixed') commissionPct = 0;
    if (compensationType === 'commission') fixedSalary = null;

    // 4. Salva no banco de dados com segurança
    const newBarber = await prisma.barber.create({
      data: {
        tenantId,
        name: validatedData.name,
        phone: validatedData.phone,
        specialty: validatedData.specialty,
        compensationType,
        commissionPct,
        fixedSalary,
        isActive: validatedData.isActive,
        workStart: validatedData.workStart,
        workEnd: validatedData.workEnd,
        lunchStart: validatedData.lunchStart,
        lunchEnd: validatedData.lunchEnd,
        notes: validatedData.notes,
      }
    });

    res.status(201).json(newBarber);
  } catch (error) {
    next(error); // Repassa para o errorHandler global
  }
};

export const listBarbers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    // Busca apenas os barbeiros pertencentes a ESTE tenant.
    // Previne vulnerabilidade IDOR (Insecure Direct Object Reference).
    const barbers = await prisma.barber.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    res.json(barbers);
  } catch (error) {
    next(error);
  }
};

export const updateBarber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    console.log("UPDATE BARBER REQ BODY:", req.body);
    const data = createBarberSchema.partial().parse(req.body);
    console.log("UPDATE BARBER PARSED DATA:", data);
    const tenantId = req.user!.tenantId;

    let { commissionPct, fixedSalary, compensationType } = data;
    if (compensationType === 'fixed') commissionPct = 0;
    if (compensationType === 'commission') fixedSalary = null;

    const updated = await prisma.barber.updateMany({
      where: { id, tenantId },
      data: {
        ...data,
        commissionPct,
        fixedSalary,
        compensationType
      }
    });

    if (updated.count === 0) return res.status(404).json({ error: 'Barbeiro não encontrado.' });
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const deleteBarber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenantId;
    
    // Verifica se existe
    const barber = await prisma.barber.findFirst({ where: { id, tenantId } });
    if (!barber) return res.status(404).json({ error: 'Barbeiro não encontrado.' });

    // Exclui agendamentos relacionados para evitar erro de Foreign Key
    await prisma.appointment.deleteMany({ where: { barberId: id } });

    await prisma.barber.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) { next(error); }
};
