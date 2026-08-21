import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/otpController';

const router = Router();

router.post('/request', requestOtp);
router.post('/verify', verifyOtp);

export default router;
