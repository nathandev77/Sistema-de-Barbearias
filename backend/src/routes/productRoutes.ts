import { Router } from 'express';
import { createProduct, listProducts, updateProduct, deleteProduct } from '../controllers/productController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', requireRole(['ADMIN']), createProduct);
router.get('/', listProducts);
router.put('/:id', requireRole(['ADMIN']), updateProduct);
router.delete('/:id', requireRole(['ADMIN']), deleteProduct);

export default router;
