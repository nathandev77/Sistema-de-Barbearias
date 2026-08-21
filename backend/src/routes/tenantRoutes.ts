import { Router } from 'express';
import { getTenantSettings, updateTenantSettings } from '../controllers/tenantController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/settings', getTenantSettings);
router.put('/settings', updateTenantSettings);

export default router;
