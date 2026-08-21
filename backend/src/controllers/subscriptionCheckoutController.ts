import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';

export const SAAS_PLANS = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 59.90,
    interval: 'mês',
    durationMonths: 1,
    description: 'Acesso completo ao sistema, agendamentos ilimitados, IA e relatórios.',
    features: [
      'Agendamentos Ilimitados',
      'Painel Completo de Finanças e Vendas',
      'Cadastro Ilimitado de Barbeiros e Serviços',
      'Link Personalizado para Clientes',
      'Robô WhatsApp / N8N Integrado',
      'Suporte Prioritário'
    ]
  },
  {
    id: 'quarterly',
    name: 'Plano Trimestral',
    price: 149.90,
    interval: 'trimestre',
    durationMonths: 3,
    badge: 'Mais Popular',
    description: 'Economize 16% pagando a cada 3 meses com todas as ferramentas liberadas.',
    features: [
      'Tudo do Plano Mensal',
      'Economia de 16%',
      'Relatórios Avançados de Faturamento',
      'Treinamento e Setup Rápido',
      'Backup Automático em Nuvem'
    ]
  },
  {
    id: 'annual',
    name: 'Plano Anual VIP',
    price: 499.00,
    interval: 'ano',
    durationMonths: 12,
    badge: 'Maior Economia (2 meses grátis)',
    description: 'Melhor custo-benefício para barbearias profissionais consolidarem sua gestão.',
    features: [
      'Tudo do Plano Trimestral',
      'Equivalente a R$ 41,58/mês',
      '2 Meses Grátis',
      'Consultoria de Crescimento para Barbearia',
      'Ativação Imediata e Acesso VIP'
    ]
  }
];

const checkoutSchema = z.object({
  tenantId: z.string().min(1, 'ID da barbearia obrigatório'),
  planId: z.enum(['monthly', 'quarterly', 'annual']),
  paymentMethod: z.enum(['pix', 'credit_card']),
  cardDetails: z.object({
    holderName: z.string().optional(),
    cardNumber: z.string().optional(),
    expiry: z.string().optional(),
    cvv: z.string().optional()
  }).optional()
});

// Listar planos públicos do SaaS
export const getPlans = async (_req: Request, res: Response) => {
  res.json({
    trialDays: 4,
    plans: SAAS_PLANS
  });
};

// Processar pagamento e ativação da barbearia
export const processCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const plan = SAAS_PLANS.find(p => p.id === data.planId);

    if (!plan) {
      return res.status(400).json({ error: 'Plano inválido selecionado.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Barbearia não encontrada.' });
    }

    // Se o pagamento for PIX
    if (data.paymentMethod === 'pix') {
      // Gera código copia e cola e QR Code simulado/formatado padrão EMV
      const randomPixCode = `00020126580014BR.GOV.BCB.PIX0136${tenant.id.replace(/-/g, '')}520400005303986540${plan.price.toFixed(2)}5802BR5925BARBER CONTROL SAAS6009SAO PAULO62070503***6304`;
      
      // Data de expiração calculada
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);

      // Ativa o tenant automaticamente
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
        message: 'Pagamento PIX gerado e processado com sucesso!',
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

    // Se o pagamento for Cartão de Crédito
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
        message: `Assinatura do ${plan.name} ativada com sucesso!`,
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
