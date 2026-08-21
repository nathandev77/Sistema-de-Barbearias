import { Router } from 'express';
import { getPlans, processCheckout } from '../controllers/subscriptionCheckoutController';

const router = Router();

// Rota pública para listar os planos de assinatura do Barber Control
router.get('/plans', getPlans);

// Rota para processar o checkout (PIX / Cartão)
router.post('/process', processCheckout);

export default router;
