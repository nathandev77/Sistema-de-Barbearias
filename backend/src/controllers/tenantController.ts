import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getTenantSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        workingDays: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

export const updateTenantSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { workingDays } = req.body;

    if (workingDays === undefined) {
      return res.status(400).json({ error: 'workingDays é obrigatório' });
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { workingDays }
    });

    res.json({ success: true, tenant });
  } catch (error) {
    next(error);
  }
};
