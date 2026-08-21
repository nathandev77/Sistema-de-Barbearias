import { Router } from 'express';
import { createReservation, listReservations, updateReservation } from '../controllers/productReservationController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', createReservation);
router.get('/', listReservations);
router.put('/:id', updateReservation);

export default router;
