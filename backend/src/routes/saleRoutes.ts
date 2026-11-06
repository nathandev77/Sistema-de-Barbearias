import { Router } from 'express';
import { createSale, listSales, updateSale, deleteSale } from '../controllers/saleController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', requireRole(['ADMIN']), createSale);    // Only ADMIN creates sales
router.get('/', listSales);                              // All authenticated users can list
router.put('/:id', requireRole(['ADMIN']), updateSale);  // Only ADMIN edits
router.delete('/:id', requireRole(['ADMIN']), deleteSale); // Only ADMIN deletes

export default router;
