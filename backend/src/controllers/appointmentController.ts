import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

const appointmentSchema = z.object({
  clientId: z.string(),
  barberId: z.string(),
  serviceIds: z.array(z.string()).min(1),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
  price: z.number().min(0),
  status: z.enum(['agendado', 'confirmado', 'concluido', 'cancelado']).default('agendado'),
  notes: z.string().optional()
});

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = appointmentSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    
    // Verificações de Segurança Rigorosas: 
    // Garantir que cliente, barbeiro e serviço PERTENCEM a este tenant. (Anti-IDOR)
    const [client, barber, services] = await Promise.all([
      prisma.client.findFirst({ where: { id: data.clientId, tenantId } }),
      prisma.barber.findFirst({ where: { id: data.barberId, tenantId } }),
      prisma.service.findMany({ where: { id: { in: data.serviceIds }, tenantId } })
    ]);

    if (!client || !barber || services.length !== data.serviceIds.length) {
      return res.status(403).json({ error: 'Violação de Segurança: Referência inválida ou pertencente a outra barbearia.' });
    }

    // Verifica se o cliente já tem agendamento para este dia (limite 1 por dia)
    const dailyAppointments = await prisma.appointment.count({
      where: {
        tenantId,
        clientId: data.clientId,
        date: data.date,
        status: { not: 'cancelado' }
      }
    });

    if (dailyAppointments >= 1) {
      return res.status(400).json({ error: 'Este cliente já possui um agendamento marcado para este dia.' });
    }

    // Verifica assinatura ativa
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        tenantId,
        clientId: data.clientId,
        status: 'active',
        creditsLeft: { gt: 0 },
        endDate: { gte: new Date() }
      },
      orderBy: { endDate: 'asc' }
    });

    let finalPrice = data.price;
    let notes = data.notes || '';

    if (activeSubscription) {
      finalPrice = 0;
      notes += notes ? ' (Pago via Plano)' : 'Pago via Plano';
      
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { creditsLeft: activeSubscription.creditsLeft - 1 }
      });
    }

    // Verifica duplicidade de horário
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        tenantId,
        barberId: data.barberId,
        date: data.date,
        time: data.time,
        status: { not: 'cancelado' }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'Este horário já está reservado para este barbeiro.' });
    }

    const { serviceIds, ...appointmentData } = data;
    const appointment = await prisma.appointment.create({ 
      data: { 
        ...appointmentData, 
        price: finalPrice, 
        notes, 
        tenantId,
        services: {
          connect: serviceIds.map(id => ({ id }))
        }
      } 
    });

    // NOTA: Receita de serviços é calculada dinamicamente no frontend
    // a partir dos agendamentos com status 'concluido' ou 'confirmado'.
    // NÃO criamos registros de Expense aqui (Expense é exclusivamente para SAÍDAS de caixa).

    res.status(201).json(appointment);
  } catch (error) { next(error); }
};

export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointments = await prisma.appointment.findMany({ 
      where: { tenantId: req.user!.tenantId },
      include: { client: true, barber: true, services: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });
    
    const formatted = appointments.map(a => ({
      ...a,
      client_name: a.client?.name || 'Cliente Removido',
      barber_name: a.barber?.name || 'Barbeiro Removido',
      service_name: a.services?.map(s => s.name).join(', ') || 'Serviço Removido',
    }));
    
    res.json(formatted);
  } catch (error) { next(error); }
};

const appointmentUpdateSchema = appointmentSchema.partial();

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const data = appointmentUpdateSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const existing = await prisma.appointment.findUnique({
      where: { id, tenantId },
      include: { services: true, client: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (data.clientId || data.barberId || data.serviceIds) {
      const [client, barber, services] = await Promise.all([
        data.clientId ? prisma.client.findFirst({ where: { id: data.clientId, tenantId } }) : Promise.resolve(true),
        data.barberId ? prisma.barber.findFirst({ where: { id: data.barberId, tenantId } }) : Promise.resolve(true),
        data.serviceIds ? prisma.service.findMany({ where: { id: { in: data.serviceIds }, tenantId } }) : Promise.resolve(true)
      ]);

      if (!client || !barber || (data.serviceIds && Array.isArray(services) && services.length !== data.serviceIds.length)) {
        return res.status(403).json({ error: 'Violação de Segurança: Referência inválida ou pertencente a outra barbearia.' });
      }
    }

    // Verifica duplicidade se a data, hora ou barbeiro mudaram
    if (data.date || data.time || data.barberId) {
      const checkDate = data.date || existing.date;
      const checkTime = data.time || existing.time;
      const checkBarber = data.barberId || existing.barberId;
      
      const duplicate = await prisma.appointment.findFirst({
        where: {
          tenantId,
          barberId: checkBarber,
          date: checkDate,
          time: checkTime,
          id: { not: id },
          status: { not: 'cancelado' }
        }
      });
      if (duplicate && data.status !== 'cancelado') {
        return res.status(400).json({ error: 'Este horário já está reservado.' });
      }
    }

    const { serviceIds, ...updateData } = data;
    const appointment = await prisma.appointment.update({
      where: { id, tenantId },
      data: {
        ...updateData,
        ...(serviceIds ? { services: { set: serviceIds.map(id => ({ id })) } } : {})
      }
    });

    // Note: Revenue is dynamically calculated on the frontend by filtering completed appointments.
    // Do NOT create an Expense here, as the Expense table is strictly for outgoings.
    
    return res.json(appointment);
  } catch (error) { next(error); }
};

export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const tenantId = req.user!.tenantId;
    
    await prisma.appointment.delete({
      where: { id, tenantId }
    });
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId, date } = req.query;
    if (!barberId || typeof barberId !== 'string' || !date || typeof date !== 'string') {
      return res.status(400).json({ error: 'barberId e date são obrigatórios.' });
    }
    
    const tenantId = req.user!.tenantId;

    const barber = await prisma.barber.findUnique({
      where: { id: barberId, tenantId }
    });

    if (!barber) {
      return res.status(404).json({ error: 'Barbeiro não encontrado.' });
    }

    const startStr = barber.workStart || "09:00";
    const endStr = barber.workEnd || "18:00";

    const startSplit = startStr.split(':').map(Number);
    const endSplit = endStr.split(':').map(Number);

    const startMins = startSplit[0] * 60 + startSplit[1];
    const endMins = endSplit[0] * 60 + endSplit[1];

    const lunchStartStr = (barber as any).lunchStart;
    const lunchEndStr = (barber as any).lunchEnd;
    let lunchStartMins = -1;
    let lunchEndMins = -1;

    if (lunchStartStr && lunchEndStr) {
      const [lsH, lsM] = lunchStartStr.split(':').map(Number);
      const [leH, leM] = lunchEndStr.split(':').map(Number);
      lunchStartMins = lsH * 60 + lsM;
      lunchEndMins = leH * 60 + leM;
    }

    // Gerar slots de 30 em 30 min
    const allSlots: string[] = [];
    for (let m = startMins; m < endMins; m += 30) {
      // Ignorar se o slot estiver dentro do intervalo de almoço
      if (lunchStartMins !== -1 && m >= lunchStartMins && m < lunchEndMins) {
        continue;
      }
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      allSlots.push(`${hh}:${mm}`);
    }

    // Buscar agendamentos existentes no dia
    const existing = await prisma.appointment.findMany({
      where: {
        tenantId,
        barberId,
        date,
        status: { not: 'cancelado' }
      },
      select: { time: true }
    });

    const bookedTimes = new Set(existing.map(a => a.time));

    let availableSlots = allSlots.filter(slot => !bookedTimes.has(slot));

    // Bloqueia horários que já passaram no dia de hoje (Fuso de Brasília) e dias anteriores
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(now);
    const p = (type: string) => parts.find(x => x.type === type)?.value;
    const todayStr = `${p('year')}-${p('month')}-${p('day')}`;
    
    if (date < todayStr) {
      availableSlots = [];
    } else if (date === todayStr) {
      const currentHour = parseInt(p('hour') || '0', 10);
      const currentMin = parseInt(p('minute') || '0', 10);
      const currentTimeInMins = currentHour * 60 + currentMin;

      availableSlots = availableSlots.filter(slot => {
        const [h, m] = slot.split(':').map(Number);
        return (h * 60 + m) > currentTimeInMins;
      });
    }

    res.json(availableSlots);
  } catch (error) {
    next(error);
  }
};
