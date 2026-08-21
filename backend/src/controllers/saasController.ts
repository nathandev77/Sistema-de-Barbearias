import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getDashboardData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: { name: true, email: true, role: true }
        },
        _count: {
          select: {
            users: true,
            clients: true,
            barbers: true,
            appointments: true,
            sales: true
          }
        }
      }
    });

    const now = new Date();

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.isActive && t.subscriptionStatus === 'active').length;
    const trialTenants = tenants.filter(t => t.subscriptionStatus === 'trial' && (!t.trialEndsAt || new Date(t.trialEndsAt) >= now)).length;
    const expiredTenants = tenants.filter(t => (t.subscriptionStatus === 'trial' && t.trialEndsAt && new Date(t.trialEndsAt) < now) || t.subscriptionStatus === 'expired').length;
    const blockedTenants = tenants.filter(t => !t.isActive || t.subscriptionStatus === 'blocked').length;

    // Métricas agregadas
    const totalBarbers = tenants.reduce((acc, t) => acc + (t._count.barbers || 0), 0);
    const totalClients = tenants.reduce((acc, t) => acc + (t._count.clients || 0), 0);
    const totalAppointments = tenants.reduce((acc, t) => acc + (t._count.appointments || 0), 0);

    const formattedTenants = tenants.map(t => {
      let daysRemaining: number | null = null;
      let isExpired = false;

      if (t.subscriptionStatus === 'trial' && t.trialEndsAt) {
        const diffMs = new Date(t.trialEndsAt).getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 0) {
          isExpired = true;
          daysRemaining = 0;
        }
      }

      const primaryOwner = t.users.find(u => u.role === 'ADMIN') || t.users[0];

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        isActive: t.isActive,
        subscriptionStatus: t.subscriptionStatus,
        trialEndsAt: t.trialEndsAt,
        planType: t.planType || 'pro',
        subscriptionExpiresAt: t.subscriptionExpiresAt,
        trialDaysRemaining: daysRemaining,
        isTrialExpired: isExpired,
        createdAt: t.createdAt,
        owner: primaryOwner ? { name: primaryOwner.name, email: primaryOwner.email } : null,
        counts: t._count
      };
    });

    res.json({
      metrics: {
        totalTenants,
        activeTenants,
        trialTenants,
        expiredTenants,
        blockedTenants,
        totalBarbers,
        totalClients,
        totalAppointments
      },
      tenants: formattedTenants
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenantStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: id as string },
      data: {
        ...(status ? { subscriptionStatus: status } : {}),
        ...(isActive !== undefined ? { isActive } : {})
      }
    });

    res.json({ success: true, message: 'Status da barbearia atualizado.', tenant });
  } catch (error) {
    next(error);
  }
};

export const extendTenantTrial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.body;

    const currentTenant = await prisma.tenant.findUnique({ where: { id: id as string } });
    if (!currentTenant) {
      res.status(404).json({ error: 'Barbearia não encontrada.' });
      return;
    }

    const baseDate = currentTenant.trialEndsAt && new Date(currentTenant.trialEndsAt) > new Date()
      ? new Date(currentTenant.trialEndsAt)
      : new Date();

    const newTrialEndsAt = new Date(baseDate.getTime() + Number(days) * 24 * 60 * 60 * 1000);

    const updated = await prisma.tenant.update({
      where: { id: id as string },
      data: {
        trialEndsAt: newTrialEndsAt,
        subscriptionStatus: 'trial',
        isActive: true
      }
    });

    res.json({
      success: true,
      message: `Teste estendido com sucesso em +${days} dias.`,
      trialEndsAt: updated.trialEndsAt
    });
  } catch (error) {
    next(error);
  }
};

export const activateTenantPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { planType = 'pro', durationMonths = 1 } = req.body;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths));

    const updated = await prisma.tenant.update({
      where: { id: id as string },
      data: {
        subscriptionStatus: 'active',
        planType,
        subscriptionExpiresAt: expiresAt,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: `Plano ${planType.toUpperCase()} ativado com sucesso!`,
      tenant: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.tenant.delete({
      where: { id: id as string }
    });

    res.json({ success: true, message: 'Barbearia excluída com sucesso.' });
  } catch (error) {
    next(error);
  }
};
