import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

// Zod Validation Schema (Zero Trust)
// Everything coming from the Frontend goes through this relentless funnel.
const createBarberSchema = z.object({
  name: z.string().min(3, "The name must be at least 3 characters."),
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
    // 1. Zod filters and rejects any garbage or dangerous data sent by the frontend
    const validatedData = createBarberSchema.parse(req.body);

    // 2. Extract the tenantId based EXCLUSIVELY on the JWT token (req.user), 
    // completely ignoring any fake tenantId the frontend may try to send.
    const tenantId = req.user!.tenantId;

    // 3. Secure Business Rule on the Backend: 
    // Ensures consistency between commission and fixed salary.
    let { commissionPct, fixedSalary, compensationType } = validatedData;
    if (compensationType === 'fixed') commissionPct = 0;
    if (compensationType === 'commission') fixedSalary = null;

    // 4. Save to the database securely
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
    next(error); // Forward to the global errorHandler
  }
};

export const listBarbers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    // Fetch only the barbers belonging to THIS tenant.
    // Prevents IDOR (Insecure Direct Object Reference) vulnerability.
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

    if (updated.count === 0) return res.status(404).json({ error: 'Barber not found.' });
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const deleteBarber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.tenantId;
    
    // Check that it exists
    const barber = await prisma.barber.findFirst({ where: { id, tenantId } });
    if (!barber) return res.status(404).json({ error: 'Barber not found.' });

    // Delete related appointments to avoid a Foreign Key error
    await prisma.appointment.deleteMany({ where: { barberId: id } });

    await prisma.barber.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) { next(error); }
};
