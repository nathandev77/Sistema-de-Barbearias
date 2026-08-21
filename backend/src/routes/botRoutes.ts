import { Router } from 'express';
import {
  getBotInfo,
  getAvailableSlots,
  createBotAppointment,
  createGenericBotAppointment,
  upsertBotClient
} from '../controllers/botController';

const router = Router();

// Rotas públicas (ou com autenticação via API Key no futuro) 
// específicas para o Bot (n8n, Typebot, etc.)

// Retorna lista de serviços e barbeiros de uma barbearia
router.get('/:tenantSlug/info', getBotInfo);

// Retorna horários disponíveis para uma data
// Ex: GET /api/bot/minha-barbearia/horarios?date=2024-05-20&barberId=...
router.get('/:tenantSlug/horarios', getAvailableSlots);

// Cria um agendamento (busca ou cria cliente por telefone)
router.post('/:tenantSlug/agendar', createBotAppointment);

// Cria um agendamento genérico passando o tenantId no body
router.post('/appointments/generic', createGenericBotAppointment);

// Cria ou atualiza cliente pelo telefone (upsert) — substitui o Supabase INSERT do N8N
router.post('/clients', upsertBotClient);

export default router;
