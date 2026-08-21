import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const saleSchema = z.object({
  productId: z.string(),
  barberId: z.string().optional().nullable(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  date: z.string() // YYYY-MM-DD
});

export const createSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = saleSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    // Verificar se o produto pertence ao tenant
    const product = await prisma.product.findFirst({ where: { id: data.productId, tenantId } });
    if (!product) return res.status(403).json({ error: 'Produto inválido.' });
    
    // Validar Estoque
    if (product.stock < data.quantity) return res.status(400).json({ error: 'Estoque insuficiente.' });

    const totalPrice = data.quantity * data.unitPrice;

    // Transação Atômica: Registrar Venda E Baixar Estoque simultaneamente
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          tenantId,
          productId: data.productId,
          barberId: data.barberId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalPrice,
          date: data.date
        }
      });

      await tx.product.update({
        where: { id: data.productId },
        data: { stock: { decrement: data.quantity } }
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (error) { next(error); }
};

export const listSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sales = await prisma.sale.findMany({ 
      where: { tenantId: req.user!.tenantId },
      include: { product: true, barber: true },
      orderBy: { date: 'desc' }
    });
    
    const formatted = sales.map(s => ({
      ...s,
      product_name: s.product?.name || 'Produto Removido',
      barber_name: s.barber?.name || '',
      total: s.totalPrice
    }));
    
    res.json(formatted);
  } catch (error) { next(error); }
};

const saleUpdateSchema = saleSchema.partial();

export const updateSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const data = saleUpdateSchema.parse(req.body);
    
    // We only allow updating date, barberId, or notes to avoid complex stock reconciliation
    // A robust system would calculate quantity diffs and update stock accordingly.
    const allowedData = {
      date: data.date,
      barberId: data.barberId
    };

    const sale = await prisma.sale.update({
      where: { id, tenantId: req.user!.tenantId },
      data: allowedData
    });
    res.json(sale);
  } catch (error) { next(error); }
};

export const deleteSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const tenantId = req.user!.tenantId;

    const sale = await prisma.sale.findFirst({ where: { id, tenantId } });
    if (!sale) return res.status(404).json({ error: 'Venda não encontrada' });

    // Restore stock and delete sale in transaction
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: sale.productId },
        data: { stock: { increment: sale.quantity } }
      });
      await tx.sale.delete({
        where: { id }
      });
    });

    res.json({ success: true });
  } catch (error) { next(error); }
};
