import { Router } from 'express';
import { sendOtp, resendOtp } from '../controllers/otp';

const router = Router();

router.post("/send-otp", sendOtp);
router.put("/resend-otp", resendOtp);

export default router;