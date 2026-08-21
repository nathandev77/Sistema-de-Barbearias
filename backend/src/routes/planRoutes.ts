import { Router } from 'express';
import {
  getPlans,
  createPlan,
  deletePlan,
  subscribeClient,
  getClientSubscriptions,
  getAllSubscriptions,
  updateSubscriptionStatus,
  deleteSubscription
} from '../controllers/planController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

// Leitura — todos os autenticados podem ver planos e assinaturas
router.get('/', getPlans);
router.get('/subscriptions', getAllSubscriptions);
router.get('/client/:clientId', getClientSubscriptions);

// Mutações financeiras — exclusivo ADMIN
router.post('/', requireRole(['ADMIN']), createPlan);
router.delete('/:id', requireRole(['ADMIN']), deletePlan);
router.post('/subscribe', requireRole(['ADMIN']), subscribeClient);
router.put('/subscriptions/:id/status', requireRole(['ADMIN']), updateSubscriptionStatus);
router.delete('/subscriptions/:id', requireRole(['ADMIN']), deleteSubscription);

export default router;
