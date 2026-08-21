import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const createSchema = z.object({
  client_id: z.string(),
  client_name: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  price: z.number(),
  quantity: z.number().default(1),
  status: z.string().default('pendente'),
});

const updateSchema = z.object({
  status: z.enum(['pendente', 'concluido', 'cancelado']),
});

export const createReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    // Apenas garante que o produto e cliente pertencem a este tenant
    const [client, product] = await Promise.all([
      prisma.client.findFirst({ where: { id: data.client_id, tenantId } }),
      prisma.product.findFirst({ where: { id: data.product_id, tenantId } })
    ]);

    if (!client || !product) {
      return res.status(403).json({ error: 'Referência inválida de cliente ou produto.' });
    }

    if (product.stock < data.quantity) {
      return res.status(400).json({ error: 'Estoque insuficiente.' });
    }

    const reservation = await prisma.$transaction(async (tx) => {
      // Cria a reserva
      const resv = await tx.productReservation.create({
        data: {
          tenantId,
          clientId: data.client_id,
          productId: data.product_id,
          status: data.status,
          price: product.price * data.quantity, // Calcula o preco total usando o preco base * qty
          quantity: data.quantity
        }
      });

      // Diminui o estoque
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: data.quantity } }
      });

      return resv;
    });

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};

export const listReservations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const status = req.query.status as string;

    const where: any = { tenantId };
    if (status) where.status = status;

    const reservations = await prisma.productReservation.findMany({
      where,
      include: {
        client: true,
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mapeia para o formato que o frontend espera (snake_case properties compatibilidade)
    const formatted = reservations.map(r => ({
      id: r.id,
      client_id: r.clientId,
      client_name: r.client.name,
      product_id: r.productId,
      product_name: r.product.name,
      status: r.status,
      price: r.price,
      quantity: r.quantity,
      createdAt: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const data = updateSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const reservation = await prisma.productReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.productReservation.update({
        where: { id },
        data: { status: data.status }
      });

      // Se for cancelado, devolve o estoque
      if (data.status === 'cancelado' && reservation.status === 'pendente') {
        await tx.product.update({
          where: { id: reservation.productId },
          data: { stock: { increment: reservation.quantity } }
        });
      }
      return up;
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
