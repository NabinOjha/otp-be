import { Router } from 'express';
import { sendOtp, resendOtp } from '../controllers/otp';

const router = Router();

router.post("/send", sendOtp);
router.put("/resend", resendOtp);

export default router;