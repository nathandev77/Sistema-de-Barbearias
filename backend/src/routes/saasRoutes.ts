import { Router } from 'express';
import { 
  getDashboardData, 
  deleteTenant, 
  updateTenantStatus, 
  extendTenantTrial, 
  activateTenantPlan 
} from '../controllers/saasController';
import {
  getFinancialMetrics,
  listCosts,
  createCost,
  updateCost,
  deleteCost,
} from '../controllers/saasFinancialController';
import { saasAuthMiddleware } from '../middlewares/saasAuthMiddleware';

const router = Router();

// All /api/saas routes require the master key
router.use(saasAuthMiddleware);

router.get('/dashboard', getDashboardData);
router.patch('/tenants/:id/status', updateTenantStatus);
router.patch('/tenants/:id/extend-trial', extendTenantTrial);
router.patch('/tenants/:id/activate-plan', activateTenantPlan);
router.delete('/tenants/:id', deleteTenant);

// Financial Metrics + General Control
router.get('/financial-metrics', getFinancialMetrics);

// Operating Costs CRUD
router.get('/costs', listCosts);
router.post('/costs', createCost);
router.patch('/costs/:id', updateCost);
router.delete('/costs/:id', deleteCost);

export default router;
