import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';

const app = express();
app.use(cors({ credentials: true, origin: process.env.APP_URL }));

app.use(cookieParser());

app.use(express.json());

app.use('/auth', authRoutes);

app.use(errorHandler);
export default app;
