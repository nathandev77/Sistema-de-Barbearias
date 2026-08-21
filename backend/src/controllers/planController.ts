import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('Tenant não encontrado');

    const plans = await prisma.plan.findMany({
      where: { tenantId }
    });
    res.json(plans);
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('Tenant não encontrado');

    const { name, description, price, serviceCount } = req.body;

    const plan = await prisma.plan.create({
      data: {
        tenantId,
        name,
        description,
        price: Number(price),
        serviceCount: Number(serviceCount),
        intervalMonths: 1, // Fixo 1 mes por enquanto
        isActive: true
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params as { id: string };

    await prisma.plan.delete({
      where: { id, tenantId }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Funções para lidar com as assinaturas (vincular cliente)
export const subscribeClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { clientId, planId, status = 'active' } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id: planId, tenantId } });
    if (!plan) throw new Error('Plano não encontrado');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.intervalMonths);

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenantId!,
        clientId,
        planId,
        status,
        startDate,
        endDate,
        creditsLeft: plan.serviceCount
      }
    });

    if (status === 'active') {
      // Registrar a venda do plano como Receita (Sale) em vez de Despesa
      let planProduct = await prisma.product.findFirst({
        where: { tenantId: tenantId!, name: 'Assinatura de Plano' }
      });
      if (!planProduct) {
        planProduct = await prisma.product.create({
          data: {
            tenantId: tenantId!,
            name: 'Assinatura de Plano',
            category: 'Planos VIP',
            price: 0,
            cost: 0,
            stock: 999999
          }
        });
      }

      await prisma.sale.create({
        data: {
          tenantId: tenantId!,
          productId: planProduct.id,
          quantity: 1,
          unitPrice: plan.price,
          totalPrice: plan.price,
          date: startDate.toISOString().split('T')[0],
        }
      });
    }

    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
};

export const getClientSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { clientId } = req.params as { clientId: string };

    const subs = await prisma.subscription.findMany({
      where: { tenantId, clientId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(subs);
  } catch (error) {
    next(error);
  }
};

export const getAllSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    const subs = await prisma.subscription.findMany({
      where: { tenantId },
      include: { plan: true, client: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(subs);
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params as { id: string };
    const { status } = req.body;

    const sub = await prisma.subscription.findUnique({ where: { id, tenantId }, include: { plan: true } });
    if (!sub) throw new Error('Assinatura não encontrada');

    // If activating a pending subscription, we can reset the start and end dates
    const data: any = { status };
    if (status === 'active' && sub.status !== 'active') {
      data.startDate = new Date();
      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + sub.plan.intervalMonths);
      data.endDate = newEndDate;
      data.creditsLeft = sub.plan.serviceCount;

      // Create expense record for payment received -> Changed to Sale (Revenue)
      let planProduct = await prisma.product.findFirst({
        where: { tenantId: tenantId!, name: 'Assinatura de Plano' }
      });
      if (!planProduct) {
        planProduct = await prisma.product.create({
          data: {
            tenantId: tenantId!,
            name: 'Assinatura de Plano',
            category: 'Planos VIP',
            price: 0,
            cost: 0,
            stock: 999999
          }
        });
      }

      await prisma.sale.create({
        data: {
          tenantId: tenantId!,
          productId: planProduct.id,
          quantity: 1,
          unitPrice: sub.plan.price,
          totalPrice: sub.plan.price,
          date: data.startDate.toISOString().split('T')[0],
        }
      });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params as { id: string };

    await prisma.subscription.delete({
      where: { id, tenantId }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
