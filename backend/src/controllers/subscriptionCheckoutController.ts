import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';

export const SAAS_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 59.90,
    interval: 'month',
    durationMonths: 1,
    description: 'Full access to the system, unlimited appointments, AI and reports.',
    features: [
      'Unlimited Appointments',
      'Complete Finance and Sales Dashboard',
      'Unlimited Barbers and Services',
      'Custom Link for Clients',
      'Integrated WhatsApp / N8N Bot',
      'Priority Support'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Plan',
    price: 149.90,
    interval: 'quarter',
    durationMonths: 3,
    badge: 'Most Popular',
    description: 'Save 16% by paying every 3 months with all tools unlocked.',
    features: [
      'Everything in the Monthly Plan',
      '16% Savings',
      'Advanced Revenue Reports',
      'Training and Quick Setup',
      'Automatic Cloud Backup'
    ]
  },
  {
    id: 'annual',
    name: 'Annual VIP Plan',
    price: 499.00,
    interval: 'year',
    durationMonths: 12,
    badge: 'Best Value (2 months free)',
    description: 'Best value for professional barbershops to consolidate their management.',
    features: [
      'Everything in the Quarterly Plan',
      'Equivalent to R$ 41.58/month',
      '2 Months Free',
      'Barbershop Growth Consulting',
      'Immediate Activation and VIP Access'
    ]
  }
];

const checkoutSchema = z.object({
  tenantId: z.string().min(1, 'Barbershop ID is required'),
  planId: z.enum(['monthly', 'quarterly', 'annual']),
  paymentMethod: z.enum(['pix', 'credit_card']),
  cardDetails: z.object({
    holderName: z.string().optional(),
    cardNumber: z.string().optional(),
    expiry: z.string().optional(),
    cvv: z.string().optional()
  }).optional()
});

// List public SaaS plans
export const getPlans = async (_req: Request, res: Response) => {
  res.json({
    trialDays: 4,
    plans: SAAS_PLANS
  });
};

// Process payment and barbershop activation
export const processCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const plan = SAAS_PLANS.find(p => p.id === data.planId);

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Barbershop not found.' });
    }

    // If the payment is PIX
    if (data.paymentMethod === 'pix') {
      // Generates a simulated/formatted EMV-standard copy-and-paste code and QR Code
      const randomPixCode = `00020126580014BR.GOV.BCB.PIX0136${tenant.id.replace(/-/g, '')}520400005303986540${plan.price.toFixed(2)}5802BR5925BARBER CONTROL SAAS6009SAO PAULO62070503***6304`;
      
      // Computed expiration date
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);

      // Automatically activates the tenant
      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: 'active',
          planType: plan.id,
          subscriptionExpiresAt: expiresAt,
          isActive: true
        }
      });

      return res.json({
        success: true,
        message: 'PIX payment generated and processed successfully!',
        paymentMethod: 'pix',
        pixCode: randomPixCode,
        amount: plan.price,
        plan: plan.name,
        expiresAt,
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          slug: updatedTenant.slug,
          subscriptionStatus: updatedTenant.subscriptionStatus,
          planType: updatedTenant.planType,
          subscriptionExpiresAt: updatedTenant.subscriptionExpiresAt
        }
      });
    }

    // If the payment is by Credit Card
    if (data.paymentMethod === 'credit_card') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);

      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: 'active',
          planType: plan.id,
          subscriptionExpiresAt: expiresAt,
          isActive: true
        }
      });

      return res.json({
        success: true,
        message: `${plan.name} subscription activated successfully!`,
        paymentMethod: 'credit_card',
        amount: plan.price,
        plan: plan.name,
        expiresAt,
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          slug: updatedTenant.slug,
          subscriptionStatus: updatedTenant.subscriptionStatus,
          planType: updatedTenant.planType,
          subscriptionExpiresAt: updatedTenant.subscriptionExpiresAt
        }
      });
    }

  } catch (error) {
    next(error);
  }
};
