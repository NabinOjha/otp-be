import { Router } from 'express';
import { sendOtp, veifyOtp } from './../controllers/auth';

const router = Router();

router.post('/send-otp', sendOtp);
router.put('/verify-otp', veifyOtp);

router.post('/current-user', sendOtp);
router.put('/sign-out', veifyOtp);

export default router;
