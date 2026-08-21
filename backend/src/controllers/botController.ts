import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BotService } from '../services/botService';

const cleanStr = (s: string) => s.replace(/\n/g, '').replace(/\r/g, '').trim();

const botAppointmentSchema = z.object({
  clientPhone: z.string(),
  clientName: z.string().optional(),
  serviceId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
  barberId: z.string(),
  date: z.string(),
  time: z.string()
});

const botGenericAppointmentSchema = z.object({
  tenantId: z.string().transform(cleanStr),
  clientId: z.string().transform(cleanStr).optional(),
  clientPhone: z.string().transform(cleanStr).optional(),
  clientName: z.string().transform(cleanStr).optional(),
  pushName: z.string().transform(cleanStr).optional(),
  name: z.string().transform(cleanStr).optional(),
  contactName: z.string().transform(cleanStr).optional(),
  serviceId: z.string().transform(cleanStr).optional(),
  serviceIds: z.preprocess(
    (val) => {
      if (typeof val === 'string') return val.split(',').map(s => s.replace(/\n/g, '').trim()).filter(Boolean);
      return val;
    },
    z.array(z.string().transform(cleanStr))
  ).optional(),
  barberId: z.string().transform(cleanStr),
  date: z.string().transform(cleanStr),
  time: z.string().transform(cleanStr)
});

export const upsertBotClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.tenantId || !req.body.phone) {
      return res.status(400).json({ error: 'tenantId e phone são obrigatórios.' });
    }
    const client = await BotService.upsertClient(req.body);
    res.json({ id: client.id, name: client.name, phone: client.phone });
  } catch (error: any) {
    if (error.message.includes('não encontrada')) return res.status(404).json({ error: error.message });
    next(error);
  }
};

export const getBotInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantSlug } = req.params;
    const info = await BotService.getBotInfo(tenantSlug as string);
    res.json(info);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantSlug } = req.params;
    const { date, barberId } = req.query;
    
    if (!date) return res.status(400).json({ error: 'A data é obrigatória' });
    
    const slots = await BotService.getAvailableSlots(tenantSlug as string, String(date), barberId ? String(barberId) : undefined);
    res.json(slots);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const createBotAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantSlug } = req.params;
    const data = botAppointmentSchema.parse(req.body);
    
    // Convert to generic format internally
    const genericData = {
      ...data,
      tenantId: tenantSlug
    };
    
    const result = await BotService.createGenericBotAppointment(genericData);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao processar agendamento.' });
  }
};

export const createGenericBotAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = botGenericAppointmentSchema.parse(req.body);
    const result = await BotService.createGenericBotAppointment(data);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao processar agendamento.' });
  }
};
