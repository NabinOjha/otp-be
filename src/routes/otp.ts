import { Router } from 'express';
import { sendOtp, veifyOtp } from '../controllers/otp';

const router = Router();

router.post('/send', sendOtp);
router.put('/verify', veifyOtp);

export default router;
