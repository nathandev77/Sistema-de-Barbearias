import { Router } from 'express';
import { createService, listServices, updateService, deleteService } from '../controllers/serviceController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', requireRole(['ADMIN']), createService);
router.get('/', listServices);
router.put('/:id', requireRole(['ADMIN']), updateService);   // ADMIN only
router.delete('/:id', requireRole(['ADMIN']), deleteService); // ADMIN only

export default router;
