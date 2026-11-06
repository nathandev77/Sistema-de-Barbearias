import { Router } from 'express';
import { getPlans, processCheckout } from '../controllers/subscriptionCheckoutController';

const router = Router();

// Public route to list Barber Control subscription plans
router.get('/plans', getPlans);

// Route to process checkout (PIX / Card)
router.post('/process', processCheckout);

export default router;
