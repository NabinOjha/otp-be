import { Router } from 'express';
import { currentUser, sendOtp, veifyOtp, signOut } from './../controllers/auth';

const router = Router();

router.post('/send-otp', sendOtp);
router.put('/verify-otp', veifyOtp);

router.get('/current-user', currentUser);
router.get('/sign-out', signOut);

export default router;
