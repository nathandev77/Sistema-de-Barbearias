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

// Read — all authenticated users can view plans and subscriptions
router.get('/', getPlans);
router.get('/subscriptions', getAllSubscriptions);
router.get('/client/:clientId', getClientSubscriptions);

// Financial mutations — ADMIN only
router.post('/', requireRole(['ADMIN']), createPlan);
router.delete('/:id', requireRole(['ADMIN']), deletePlan);
router.post('/subscribe', requireRole(['ADMIN']), subscribeClient);
router.put('/subscriptions/:id/status', requireRole(['ADMIN']), updateSubscriptionStatus);
router.delete('/subscriptions/:id', requireRole(['ADMIN']), deleteSubscription);

export default router;
