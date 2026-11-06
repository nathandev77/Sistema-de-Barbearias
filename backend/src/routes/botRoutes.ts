import { Router } from 'express';
import {
  getBotInfo,
  getAvailableSlots,
  createBotAppointment,
  createGenericBotAppointment,
  upsertBotClient
} from '../controllers/botController';

const router = Router();

// Public routes (or with API Key authentication in the future) 
// specific to the Bot (n8n, Typebot, etc.)

// Returns the list of services and barbers of a barbershop
router.get('/:tenantSlug/info', getBotInfo);

// Returns available time slots for a date
// e.g. GET /api/bot/my-barbershop/slots?date=2024-05-20&barberId=...
router.get('/:tenantSlug/slots', getAvailableSlots);

// Creates an appointment (finds or creates the client by phone)
router.post('/:tenantSlug/book', createBotAppointment);

// Creates a generic appointment passing the tenantId in the body
router.post('/appointments/generic', createGenericBotAppointment);

// Creates or updates a client by phone (upsert) — replaces the N8N Supabase INSERT
router.post('/clients', upsertBotClient);

export default router;
