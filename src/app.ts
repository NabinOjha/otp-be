import express from 'express';
import cors from 'cors';

import { errorHandler } from './middlewares/errorHandler';
import otpRoutes from './routes/otp';
import authRoutes from './routes/auth';

const app = express();
app.use(cors());

app.use(express.json());

app.use('/otp', otpRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);
export default app;
