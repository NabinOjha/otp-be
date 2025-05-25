import { Router } from 'express';
import { auth } from './../middlewares/auth';
import { sendOtp, veifyOtp, me } from './../controllers/auth';

const router = Router();

router.post('/send-otp', sendOtp);
router.put('/verify-otp', veifyOtp);
router.get('/me', auth, me);

export default router;
