import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';

// Helper: Sanitiza número de telefone do WhatsApp
const sanitizePhone = (phone: string): string => {
  return phone
    .split('@')[0]           // Remove @s.whatsapp.net, @c.us, etc.
    .replace(/\D/g, '')     // Remove qualquer caractere não-numérico
    .trim();
};

// Helper: Remove \n e espaços extras de strings vindas do N8N
const cleanStr = (s: string) => s.replace(/\n/g, '').replace(/\r/g, '').trim();

// Helper: Busca nome do contato na Evolution API pelo número de telefone
// Retorna string vazia se não encontrar ou se ocorrer erro.
const fetchContactName = async (phone: string, instanceName?: string): Promise<string> => {
  try {
    const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://controlbarber-evolution-api.mrsnvp.easypanel.host';
    const EVOLUTION_KEY = process.env.EVOLUTION_KEY || '';
    
    if (!EVOLUTION_KEY) return '';
    
    // Se não vier a instância, busca a primeira instância conectada
    let instance = instanceName;
    if (!instance) {
      const resp = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
        headers: { 'apikey': EVOLUTION_KEY }
      });
      if (!resp.ok) return '';
      const instances: any[] = await resp.json();
      const connected = instances.find((i: any) => i.instance?.state === 'open' || i.connectionStatus === 'open');
      instance = connected?.instance?.instanceName || connected?.name || instances[0]?.instance?.instanceName || instances[0]?.name;
    }
    
    if (!instance) return '';
    
    const jid = `${phone}@s.whatsapp.net`;
    const resp2 = await fetch(
      `${EVOLUTION_URL}/chat/findContacts/${instance}?where={"remoteJid":"${jid}"}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    if (!resp2.ok) return '';
    const contacts = await resp2.json();
    const contact = Array.isArray(contacts) ? contacts[0] : contacts;
    return contact?.pushName || contact?.name || contact?.notify || '';
  } catch {
    return '';
  }
};

// Helper: Buscar tenant pelo slug
const getTenantBySlug = async (slug: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error('Barbearia não encontrada');
  return tenant;
};


// POST /api/bot/clients — Cria ou atualiza cliente por telefone (upsert)
export const upsertBotClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[BOT] upsertBotClient body:', JSON.stringify(req.body));
    const { tenantId, phone, name } = req.body;
    if (!tenantId || !phone) {
      return res.status(400).json({ error: 'tenantId e phone são obrigatórios.' });
    }
    const tenant = await prisma.tenant.findFirst({
      where: { OR: [{ id: tenantId }, { slug: tenantId }] }
    });
    if (!tenant) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    const cleanPhone = phone.split('@')[0].replace(/\D/g, '').trim();
    const resolvedName = name?.trim();
    const isRealName = resolvedName && resolvedName !== 'Cliente WhatsApp';
    const client = await prisma.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: cleanPhone } },
      update: isRealName ? { name: resolvedName } : {},
      create: { tenantId: tenant.id, phone: cleanPhone, name: resolvedName || 'Cliente WhatsApp' }
    });
    console.log('[BOT] Cliente upserted:', client.id, client.name);
    res.json({ id: client.id, name: client.name, phone: client.phone });
  } catch (error: any) {
    next(error);
  }
};

export const getBotInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantSlug } = req.params;
    const tenant = await getTenantBySlug(tenantSlug as string);

    const [services, barbers, products] = await Promise.all([
      prisma.service.findMany({ where: { tenantId: tenant.id, isActive: true } }),
      prisma.barber.findMany({ where: { tenantId: tenant.id, isActive: true } }),
      prisma.product.findMany({ where: { tenantId: tenant.id, isActive: true, stock: { gt: 0 } } })
    ]);

    res.json({ services, barbers, products });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantSlug } = req.params;
    const { date, barberId } = req.query; // date no formato YYYY-MM-DD
    
    if (!date) return res.status(400).json({ error: 'A data é obrigatória' });
    
    const tenant = await getTenantBySlug(tenantSlug as string);
    
    // Busca agendamentos do dia (opcionalmente filtrando por barbeiro)
    const whereClause: any = { tenantId: tenant.id, date: String(date) };
    if (barberId) whereClause.barberId = String(barberId);
    
    const appointments = await prisma.appointment.findMany({ where: whereClause });
    const bookedTimes = appointments.map(a => a.time); // Ex: ['09:00', '10:30']

    // Checa se o dia requisitado é dia de funcionamento (0 = Dom, 1 = Seg...)
    const requestedDay = new Date(String(date) + 'T12:00:00Z').getDay().toString();
    const workingDaysArr = tenant.workingDays ? tenant.workingDays.split(',') : ['1','2','3','4','5','6'];
    if (!workingDaysArr.includes(requestedDay)) {
      return res.json({ date, availableSlots: [] });
    }

    let startMins = 9 * 60; // 09:00 default
    let endMins = 18 * 60;  // 18:00 default
    let lunchStartMins = -1;
    let lunchEndMins = -1;

    if (barberId) {
      const barber = await prisma.barber.findFirst({ where: { id: String(barberId), tenantId: tenant.id } });
      if (barber) {
        const [sH, sM] = (barber.workStart || "09:00").split(':').map(Number);
        const [eH, eM] = (barber.workEnd || "18:00").split(':').map(Number);
        startMins = sH * 60 + sM;
        endMins = eH * 60 + eM;

        if ((barber as any).lunchStart && (barber as any).lunchEnd) {
          const [lsH, lsM] = (barber as any).lunchStart.split(':').map(Number);
          const [leH, leM] = (barber as any).lunchEnd.split(':').map(Number);
          lunchStartMins = lsH * 60 + lsM;
          lunchEndMins = leH * 60 + leM;
        }
      }
    }

    // Gerar horários base (de 30 em 30 min)
    const allSlots: string[] = [];
    for (let m = startMins; m < endMins; m += 30) {
      if (lunchStartMins !== -1 && m >= lunchStartMins && m < lunchEndMins) {
        continue;
      }
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      allSlots.push(`${hh}:${mm}`);
    }

    let availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
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
    
    res.json({ date, availableSlots });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

const botAppointmentSchema = z.object({
  clientPhone: z.string(),
  clientName: z.string().optional(),
  serviceId: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
  barberId: z.string(),
  date: z.string(),
  time: z.string()
});

export const createBotAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantSlug } = req.params;
    const data = botAppointmentSchema.parse(req.body);
    const tenant = await getTenantBySlug(tenantSlug as string);

    // Suporte retrocompatível para o n8n antigo
    const finalServiceIds = data.serviceIds && data.serviceIds.length > 0 
      ? data.serviceIds 
      : (data.serviceId ? [data.serviceId] : []);

    if (finalServiceIds.length === 0) {
      return res.status(400).json({ error: 'serviceId ou serviceIds é obrigatório.' });
    }

    // Verifica se serviço e barbeiro existem no tenant
    const [services, barber] = await Promise.all([
      prisma.service.findMany({ where: { id: { in: finalServiceIds }, tenantId: tenant.id } }),
      prisma.barber.findFirst({ where: { id: data.barberId, tenantId: tenant.id } })
    ]);

    if (services.length !== finalServiceIds.length || !barber) {
      return res.status(400).json({ error: 'Serviço ou barbeiro inválidos.' });
    }

    // Sanitiza o telefone: remove @s.whatsapp.net e outros sufixos do WhatsApp
    const cleanPhone = sanitizePhone(data.clientPhone);
    const clientName = data.clientName?.trim() || '';

    // Busca cliente pelo telefone ou cria se não existir de forma atômica (evita duplicidade por race condition)
    let client = await prisma.client.upsert({
      where: {
        tenantId_phone: {
          tenantId: tenant.id,
          phone: cleanPhone
        }
      },
      // Atualiza o nome se um nome real foi enviado (evita manter 'Cliente WhatsApp')
      update: clientName && clientName !== 'Cliente WhatsApp'
        ? { name: clientName }
        : {},
      create: {
        tenantId: tenant.id,
        phone: cleanPhone,
        name: clientName || 'Cliente WhatsApp'
      }
    });

    // Verifica se o cliente já tem agendamento para este dia (limite 1 por dia)
    const dailyAppointments = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
        date: data.date,
        status: { not: 'cancelado' }
      }
    });

    if (dailyAppointments >= 1) {
      return res.status(400).json({ error: 'Você já possui um agendamento marcado para este dia.' });
    }

    // Verifica se o horário já está ocupado por outra pessoa
    const slotTaken = await prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        barberId: barber.id,
        date: data.date,
        time: data.time,
        status: { not: 'cancelado' }
      }
    });

    if (slotTaken) {
      return res.status(400).json({ error: 'Este horário não está mais disponível com este barbeiro.' });
    }


    // Verifica se o cliente tem uma assinatura ativa
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
        status: 'active',
        creditsLeft: { gt: 0 },
        endDate: { gte: new Date() }
      },
      orderBy: { endDate: 'asc' }
    });

    let finalPrice = services.reduce((acc, s) => acc + s.price, 0);
    let appointmentNotes = 'Agendado via n8n/WhatsApp';

    if (activeSubscription) {
      finalPrice = 0;
      appointmentNotes += ' (Pago via Plano)';
      
      // Debita 1 crédito
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { creditsLeft: activeSubscription.creditsLeft - 1 }
      });
    }

    // Cria o agendamento
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        services: {
          connect: finalServiceIds.map(id => ({ id }))
        },
        barberId: barber.id,
        date: data.date,
        time: data.time,
        price: finalPrice,
        status: 'agendado',
        notes: appointmentNotes
      }
    });

    res.status(201).json({ success: true, appointment, client });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao processar agendamento.' });
  }
};

const botGenericAppointmentSchema = z.object({
  tenantId: z.string().transform(cleanStr),
  clientId: z.string().transform(cleanStr).optional(),
  clientPhone: z.string().transform(cleanStr).optional(),
  // Aceita vários nomes de campo que o N8N/Evolution API pode enviar
  clientName: z.string().transform(cleanStr).optional(),
  pushName: z.string().transform(cleanStr).optional(),
  name: z.string().transform(cleanStr).optional(),
  contactName: z.string().transform(cleanStr).optional(),
  serviceId: z.string().transform(cleanStr).optional(),
  // serviceIds: aceita array real OU string separada por vírgula vinda do AI agent ("id1,id2")
  serviceIds: z.preprocess(
    (val) => {
      if (typeof val === 'string') return val.split(',').map(s => s.replace(/\n/g, '').trim()).filter(Boolean);
      return val;
    },
    z.array(z.string().transform(cleanStr))
  ).optional(),
  barberId: z.string().transform(cleanStr),
  date: z.string().transform(cleanStr),  // Remove \n que o N8N inclui
  time: z.string().transform(cleanStr)
});

export const createGenericBotAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[BOT] Body recebido:', JSON.stringify(req.body));
    const data = botGenericAppointmentSchema.parse(req.body);
    
    // Resolve nome: primeiro tenta campos do body, depois busca na Evolution API
    let resolvedClientName = data.clientName || data.pushName || data.name || data.contactName || '';
    if (!resolvedClientName && data.clientPhone) {
      const cleanPhone = sanitizePhone(data.clientPhone);
      resolvedClientName = await fetchContactName(cleanPhone);
      if (resolvedClientName) {
        console.log('[BOT] Nome obtido via Evolution API:', resolvedClientName);
      }
    }
    const tenant = await prisma.tenant.findFirst({ 
      where: { 
        OR: [
          { id: data.tenantId },
          { slug: data.tenantId }
        ]
      } 
    });
    if (!tenant) throw new Error('Barbearia não encontrada pelo ID ou Slug');

    // Suporte retrocompatível para o n8n antigo e listas separadas por vírgula
    let finalServiceIds: string[] = [];
    if (data.serviceIds && data.serviceIds.length > 0) {
      finalServiceIds = data.serviceIds;
    } else if (data.serviceId) {
      // Aceita tanto um UUID único quanto múltiplos separados por vírgula
      finalServiceIds = data.serviceId.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (finalServiceIds.length === 0) {
      return res.status(400).json({ error: 'serviceId ou serviceIds é obrigatório.' });
    }

    // Verifica se serviço e barbeiro existem no tenant
    const [services, barber] = await Promise.all([
      prisma.service.findMany({ where: { id: { in: finalServiceIds }, tenantId: tenant.id } }),
      prisma.barber.findFirst({ where: { id: data.barberId, tenantId: tenant.id } })
    ]);

    // Log para debug: quais IDs foram recebidos vs encontrados
    console.log(`[BOT] serviceIds recebidos: ${finalServiceIds.join(', ')}`);
    console.log(`[BOT] services encontrados: ${services.map(s => s.name + '(' + s.id + ')').join(', ')}`);

    if (services.length === 0 || !barber) {
      return res.status(400).json({
        error: 'Serviço ou barbeiro inválidos para essa barbearia.',
        debug: { serviceIdsRecebidos: finalServiceIds, servicesEncontrados: services.length, barberEncontrado: !!barber }
      });
    }
    // Se alguns IDs eram inválidos mas pelo menos 1 serviço foi encontrado, continua com os válidos
    const validServiceIds = services.map(s => s.id);
    if (validServiceIds.length < finalServiceIds.length) {
      console.log(`[BOT] AVISO: ${finalServiceIds.length - validServiceIds.length} serviceId(s) inválido(s) ignorado(s)`);
    }

    let client;
    
    if (data.clientId) {
      // Se já enviou o clientId, tenta usar diretamente
      client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId: tenant.id } });
      
      if (!client) {
        // clientId inválido (dado deletado ou ID desatualizado da IA) — tenta pelo telefone
        console.log('[BOT] clientId não encontrado, tentando fallback por telefone...');
        if (data.clientPhone) {
          const cleanPhone = sanitizePhone(data.clientPhone);
          client = await prisma.client.upsert({
            where: { tenantId_phone: { tenantId: tenant.id, phone: cleanPhone } },
            update: resolvedClientName && resolvedClientName !== 'Cliente WhatsApp' ? { name: resolvedClientName } : {},
            create: { tenantId: tenant.id, phone: cleanPhone, name: resolvedClientName || 'Cliente WhatsApp' }
          });
          console.log('[BOT] Cliente criado/encontrado por telefone:', client.id);
        } else {
          throw new Error('Cliente não encontrado. Por favor, reinicie a conversa.');
        }
      }
      
      // Se nome ainda é genérico e temos um nome real, atualiza
      if (client.name === 'Cliente WhatsApp' && resolvedClientName && resolvedClientName !== 'Cliente WhatsApp') {
        console.log('[BOT] Atualizando nome genérico para:', resolvedClientName);
        client = await prisma.client.update({ where: { id: client.id }, data: { name: resolvedClientName } });
      }
    } else if (data.clientPhone) {
      // Sanitiza telefone: remove @s.whatsapp.net e outros sufixos da Evolution API
      const cleanPhone = sanitizePhone(data.clientPhone);
      console.log('[BOT] Nome resolvido:', resolvedClientName, '| Telefone limpo:', cleanPhone);
      // Busca cliente pelo telefone ou cria se não existir de forma atômica (evita duplicidade por race condition)
      client = await prisma.client.upsert({
        where: {
          tenantId_phone: {
            tenantId: tenant.id,
            phone: cleanPhone
          }
        },
        // Atualiza nome se um nome real foi enviado
        update: resolvedClientName && resolvedClientName !== 'Cliente WhatsApp'
          ? { name: resolvedClientName }
          : {},
        create: {
          tenantId: tenant.id,
          phone: cleanPhone,
          name: resolvedClientName || 'Cliente WhatsApp'
        }
      });
    } else {
      throw new Error('É obrigatório informar o clientId ou o clientPhone');
    }

    // Verifica se o cliente já tem agendamento para este dia (limite 1 por dia)
    const dailyAppointments = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
        date: data.date,
        status: { not: 'cancelado' }
      }
    });

    if (dailyAppointments >= 1) {
      return res.status(400).json({ error: 'Você já possui um agendamento marcado para este dia.' });
    }

    // Verifica se o horário já está ocupado por outra pessoa
    const slotTaken = await prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        barberId: barber.id,
        date: data.date,
        time: data.time,
        status: { not: 'cancelado' }
      }
    });

    if (slotTaken) {
      return res.status(400).json({ error: 'Este horário não está mais disponível com este barbeiro.' });
    }

    // Verifica se o cliente tem uma assinatura ativa
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
        status: 'active',
        creditsLeft: { gt: 0 },
        endDate: { gte: new Date() }
      },
      orderBy: { endDate: 'asc' }
    });

    let finalPrice = services.reduce((acc, s) => acc + s.price, 0);
    let appointmentNotes = 'Agendado via n8n/WhatsApp genérico';

    if (activeSubscription) {
      finalPrice = 0;
      appointmentNotes += ' (Pago via Plano)';
      
      // Debita 1 crédito
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { creditsLeft: activeSubscription.creditsLeft - 1 }
      });
    }

    // Cria o agendamento
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        services: {
          connect: validServiceIds.map(id => ({ id }))
        },
        barberId: barber.id,
        date: data.date,
        time: data.time,
        price: finalPrice,
        status: 'agendado',
        notes: appointmentNotes
      }
    });

    res.status(201).json({ success: true, appointment, client });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao processar agendamento.' });
  }
};
