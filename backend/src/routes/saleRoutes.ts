import { Router } from 'express';
import { createSale, listSales, updateSale, deleteSale } from '../controllers/saleController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', requireRole(['ADMIN']), createSale);    // Apenas ADMIN cria vendas
router.get('/', listSales);                              // Todos autenticados podem listar
router.put('/:id', requireRole(['ADMIN']), updateSale);  // Apenas ADMIN edita
router.delete('/:id', requireRole(['ADMIN']), deleteSale); // Apenas ADMIN deleta

export default router;
