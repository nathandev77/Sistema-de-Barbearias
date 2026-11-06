import { Router } from 'express';
import { createClient, listClients, updateClient, deleteClient } from '../controllers/clientController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', createClient);
router.get('/', listClients);
router.put('/:id', updateClient);
router.delete('/:id', requireRole(['ADMIN']), deleteClient); // Only ADMIN deletes clients

export default router;
