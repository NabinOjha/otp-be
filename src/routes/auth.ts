import { Router } from 'express';
import { auth } from './../middlewares/auth';
import { me } from './../controllers/auth';

const router = Router();
router.get('/me', auth, me);

export default router;
