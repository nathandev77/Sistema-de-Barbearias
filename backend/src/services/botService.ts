import { prisma } from '../prisma';
import { AppointmentService } from './appointmentService';

// Helper: Sanitiza número de telefone do WhatsApp
const sanitizePhone = (phone: string): string => {
  return phone
    .split('@')[0]
    .replace(/\D/g, '')
    .trim();
};

// Helper: Busca nome do contato na Evolution API pelo número de telefone
const fetchContactName = async (phone: string, instanceName?: string): Promise<string> => {
  try {
    const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://controlbarber-evolution-api.mrsnvp.easypanel.host';
    const EVOLUTION_KEY = process.env.EVOLUTION_KEY || '';
    
    if (!EVOLUTION_KEY) return '';
    
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

const getTenantBySlug = async (slug: string) => {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error('Barbearia não encontrada');
  return tenant;
};

export class BotService {
  static async upsertClient(data: any) {
    const { tenantId, phone, name } = data;
    const tenant = await prisma.tenant.findFirst({
      where: { OR: [{ id: tenantId }, { slug: tenantId }] }
    });
    if (!tenant) throw new Error('Barbearia não encontrada.');
    
    const cleanPhone = sanitizePhone(phone);
    const resolvedName = name?.trim();
    const isRealName = resolvedName && resolvedName !== 'Cliente WhatsApp';
    
    const client = await prisma.client.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: cleanPhone } },
      update: isRealName ? { name: resolvedName } : {},
      create: { tenantId: tenant.id, phone: cleanPhone, name: resolvedName || 'Cliente WhatsApp' }
    });
    
    return client;
  }

  static async getBotInfo(tenantSlug: string) {
    const tenant = await getTenantBySlug(tenantSlug);
    const [services, barbers, products] = await Promise.all([
      prisma.service.findMany({ where: { tenantId: tenant.id, isActive: true } }),
      prisma.barber.findMany({ where: { tenantId: tenant.id, isActive: true } }),
      prisma.product.findMany({ where: { tenantId: tenant.id, isActive: true, stock: { gt: 0 } } })
    ]);
    return { services, barbers, products };
  }

  static async getAvailableSlots(tenantSlug: string, date: string, barberId?: string) {
    const tenant = await getTenantBySlug(tenantSlug);
    
    const requestedDay = new Date(String(date) + 'T12:00:00Z').getDay().toString();
    const workingDaysArr = tenant.workingDays ? tenant.workingDays.split(',') : ['1','2','3','4','5','6'];
    if (!workingDaysArr.includes(requestedDay)) {
      return { date, availableSlots: [] };
    }

    if (barberId) {
      // Re-use core appointment service logic
      const slots = await AppointmentService.getAvailableSlots(barberId, date, tenant.id);
      return { date, availableSlots: slots };
    } else {
      // Se não enviou barberId, não faz muito sentido no novo AppointmentService,
      // mas vamos emular o comportamento anterior (buscando agendamentos globais)
      const appointments = await prisma.appointment.findMany({ where: { tenantId: tenant.id, date } });
      const bookedTimes = appointments.map(a => a.time);

      const allSlots: string[] = [];
      for (let m = 9 * 60; m < 18 * 60; m += 30) {
        const hh = Math.floor(m / 60).toString().padStart(2, '0');
        const mm = (m % 60).toString().padStart(2, '0');
        allSlots.push(`${hh}:${mm}`);
      }

      let availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
      
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
      return { date, availableSlots };
    }
  }

  static async createGenericBotAppointment(data: any) {
    let resolvedClientName = data.clientName || data.pushName || data.name || data.contactName || '';
    if (!resolvedClientName && data.clientPhone) {
      const cleanPhone = sanitizePhone(data.clientPhone);
      resolvedClientName = await fetchContactName(cleanPhone);
    }
    
    const tenant = await prisma.tenant.findFirst({ 
      where: { OR: [{ id: data.tenantId }, { slug: data.tenantId }] } 
    });
    if (!tenant) throw new Error('Barbearia não encontrada pelo ID ou Slug');

    let finalServiceIds: string[] = [];
    if (data.serviceIds && data.serviceIds.length > 0) {
      finalServiceIds = data.serviceIds;
    } else if (data.serviceId) {
      finalServiceIds = data.serviceId.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (finalServiceIds.length === 0) {
      throw new Error('serviceId ou serviceIds é obrigatório.');
    }

    const [services, barber] = await Promise.all([
      prisma.service.findMany({ where: { id: { in: finalServiceIds }, tenantId: tenant.id } }),
      prisma.barber.findFirst({ where: { id: data.barberId, tenantId: tenant.id } })
    ]);

    if (services.length === 0 || !barber) {
      throw new Error('Serviço ou barbeiro inválidos para essa barbearia.');
    }
    const validServiceIds = services.map(s => s.id);

    let client;
    if (data.clientId) {
      client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId: tenant.id } });
      if (!client) {
        if (data.clientPhone) {
          const cleanPhone = sanitizePhone(data.clientPhone);
          client = await prisma.client.upsert({
            where: { tenantId_phone: { tenantId: tenant.id, phone: cleanPhone } },
            update: resolvedClientName && resolvedClientName !== 'Cliente WhatsApp' ? { name: resolvedClientName } : {},
            create: { tenantId: tenant.id, phone: cleanPhone, name: resolvedClientName || 'Cliente WhatsApp' }
          });
        } else {
          throw new Error('Cliente não encontrado. Por favor, reinicie a conversa.');
        }
      }
      
      if (client.name === 'Cliente WhatsApp' && resolvedClientName && resolvedClientName !== 'Cliente WhatsApp') {
        client = await prisma.client.update({ where: { id: client.id }, data: { name: resolvedClientName } });
      }
    } else if (data.clientPhone) {
      const cleanPhone = sanitizePhone(data.clientPhone);
      client = await prisma.client.upsert({
        where: { tenantId_phone: { tenantId: tenant.id, phone: cleanPhone } },
        update: resolvedClientName && resolvedClientName !== 'Cliente WhatsApp' ? { name: resolvedClientName } : {},
        create: { tenantId: tenant.id, phone: cleanPhone, name: resolvedClientName || 'Cliente WhatsApp' }
      });
    } else {
      throw new Error('É obrigatório informar o clientId ou o clientPhone');
    }

    // A lógica pesada foi extraída e unificada
    const dailyAppointments = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
        date: data.date,
        status: { not: 'cancelado' }
      }
    });

    if (dailyAppointments >= 1) {
      throw new Error('Você já possui um agendamento marcado para este dia.');
    }

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
      throw new Error('Este horário não está mais disponível com este barbeiro.');
    }

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

    let finalPrice = services.reduce((acc: number, s: any) => acc + s.price, 0);
    let appointmentNotes = 'Agendado via n8n/WhatsApp genérico';

    if (activeSubscription) {
      finalPrice = 0;
      appointmentNotes += ' (Pago via Plano)';
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { creditsLeft: activeSubscription.creditsLeft - 1 }
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        services: { connect: validServiceIds.map(id => ({ id })) },
        barberId: barber.id,
        date: data.date,
        time: data.time,
        price: finalPrice,
        status: 'agendado',
        notes: appointmentNotes
      }
    });

    return { success: true, appointment, client };
  }
}
