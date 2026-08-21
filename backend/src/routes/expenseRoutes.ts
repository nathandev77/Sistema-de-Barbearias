import { Router } from 'express';
import { createExpense, listExpenses, updateExpense, deleteExpense } from '../controllers/expenseController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

router.post('/', requireRole(['ADMIN']), createExpense);
router.get('/', listExpenses);
router.put('/:id', requireRole(['ADMIN']), updateExpense);
router.delete('/:id', requireRole(['ADMIN']), deleteExpense);

export default router;
