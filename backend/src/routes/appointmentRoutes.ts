import { Router } from 'express';
import { createAppointment, listAppointments, updateAppointment, deleteAppointment, getAvailableSlots } from '../controllers/appointmentController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.get('/available-slots', getAvailableSlots);
router.post('/', createAppointment);
router.get('/', listAppointments);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
