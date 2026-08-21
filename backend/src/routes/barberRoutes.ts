import { Router } from 'express';
import { createBarber, listBarbers, updateBarber, deleteBarber } from '../controllers/barberController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', requireRole(['ADMIN']), createBarber);
router.get('/', listBarbers);
router.put('/:id', requireRole(['ADMIN']), updateBarber);
router.delete('/:id', requireRole(['ADMIN']), deleteBarber);

export default router;
