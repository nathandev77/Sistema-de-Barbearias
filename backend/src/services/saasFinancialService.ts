import { prisma } from '../prisma';
import { SAAS_PLANS } from '../controllers/subscriptionCheckoutController';

export class SaasFinancialService {
  static async listCosts() {
    return await prisma.saasCost.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createCost(data: any) {
    return await prisma.saasCost.create({ data });
  }

  static async updateCost(id: string, data: any) {
    return await prisma.saasCost.update({
      where: { id },
      data,
    });
  }

  static async deleteCost(id: string) {
    await prisma.saasCost.delete({ where: { id } });
    return { success: true };
  }

  static async getFinancialMetrics() {
    const now = new Date();

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: { select: { users: true, clients: true, barbers: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const costs = await prisma.saasCost.findMany({
      where: { isActive: true },
    });

    const totalMonthlyCosts = costs
      .filter(c => c.isRecurring)
      .reduce((acc, c) => acc + c.amount, 0);

    const totalOneTimeCosts = costs
      .filter(c => !c.isRecurring)
      .reduce((acc, c) => acc + c.amount, 0);

    const activeTenants = tenants.filter(t => t.subscriptionStatus === 'active' && t.isActive);
    
    const planPriceMap: Record<string, number> = {};
    for (const plan of SAAS_PLANS) {
      planPriceMap[plan.id] = plan.price / plan.durationMonths;
    }

    let mrr = 0;
    const revenueByPlan: Record<string, { count: number; revenue: number }> = {};
    
    for (const tenant of activeTenants) {
      const planId = tenant.planType || 'monthly';
      const monthlyPrice = planPriceMap[planId] || planPriceMap['monthly'] || 59.90;
      mrr += monthlyPrice;

      if (!revenueByPlan[planId]) {
        revenueByPlan[planId] = { count: 0, revenue: 0 };
      }
      revenueByPlan[planId].count++;
      revenueByPlan[planId].revenue += monthlyPrice;
    }

    const trialTenants = tenants.filter(t => t.subscriptionStatus === 'trial');
    const expiredTrials = tenants.filter(t => 
      (t.subscriptionStatus === 'trial' && t.trialEndsAt && new Date(t.trialEndsAt) < now) ||
      t.subscriptionStatus === 'expired'
    );
    const totalTrialsEver = activeTenants.length + trialTenants.length + expiredTrials.length;
    const conversionRate = totalTrialsEver > 0 
      ? Math.round((activeTenants.length / totalTrialsEver) * 100) 
      : 0;

    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    const recentTenants = tenants.filter(t => new Date(t.createdAt) >= twelveWeeksAgo);
    
    const weeklyGrowth: { week: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const count = recentTenants.filter(t => {
        const created = new Date(t.createdAt);
        return created >= weekStart && created < weekEnd;
      }).length;

      const weekLabel = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      weeklyGrowth.push({ week: weekLabel, count });
    }

    const monthlyGrowth: { month: string; newTenants: number; activations: number }[] = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const newInMonth = tenants.filter(t => {
        const created = new Date(t.createdAt);
        return created >= monthDate && created < nextMonth;
      }).length;

      const activatedInMonth = activeTenants.filter(t => {
        if (!t.subscriptionExpiresAt) return false;
        const expires = new Date(t.subscriptionExpiresAt);
        const planDuration = t.planType === 'annual' ? 12 : t.planType === 'quarterly' ? 3 : 1;
        const activated = new Date(expires.getTime() - planDuration * 30 * 24 * 60 * 60 * 1000);
        return activated >= monthDate && activated < nextMonth;
      }).length;

      monthlyGrowth.push({
        month: `${monthNames[monthDate.getMonth()]}/${monthDate.getFullYear().toString().slice(-2)}`,
        newTenants: newInMonth,
        activations: activatedInMonth,
      });
    }

    const churned = tenants.filter(t => 
      t.subscriptionStatus === 'expired' || 
      (t.subscriptionStatus === 'active' && t.subscriptionExpiresAt && new Date(t.subscriptionExpiresAt) < now)
    );
    const churnRate = (activeTenants.length + churned.length) > 0
      ? Math.round((churned.length / (activeTenants.length + churned.length)) * 100)
      : 0;

    const netProfit = mrr - totalMonthlyCosts;

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newLast7Days = tenants.filter(t => new Date(t.createdAt) >= sevenDaysAgo).length;
    const newLast30Days = tenants.filter(t => new Date(t.createdAt) >= thirtyDaysAgo).length;

    const costsByCategory: Record<string, number> = {};
    for (const cost of costs.filter(c => c.isRecurring)) {
      if (!costsByCategory[cost.category]) costsByCategory[cost.category] = 0;
      costsByCategory[cost.category] += cost.amount;
    }

    return {
      revenue: { mrr, arr: mrr * 12, netProfit, revenueByPlan },
      conversion: {
        totalTrials: totalTrialsEver,
        activePaying: activeTenants.length,
        conversionRate,
        trialActive: trialTenants.filter(t => !t.trialEndsAt || new Date(t.trialEndsAt) >= now).length,
        trialExpired: expiredTrials.length,
      },
      churn: { churned: churned.length, churnRate },
      growth: { newLast7Days, newLast30Days, weeklyGrowth, monthlyGrowth },
      costs: { totalMonthlyCosts, totalOneTimeCosts, costsByCategory, items: costs },
      overview: {
        totalTenants: tenants.length,
        activeTenants: activeTenants.length,
        trialTenants: trialTenants.length,
        totalBarbers: tenants.reduce((acc, t) => acc + (t._count.barbers || 0), 0),
        totalClients: tenants.reduce((acc, t) => acc + (t._count.clients || 0), 0),
        totalAppointments: tenants.reduce((acc, t) => acc + (t._count.appointments || 0), 0),
      },
    };
  }
}
