import dotenv from 'dotenv';

dotenv.config({ debug: true });

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./sentry');

import express from 'express';
import Sentry from '@sentry/node';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';

const app = express();
app.use(cors({ credentials: true, origin: process.env.APP_URL }));

app.use(cookieParser());

app.use(express.json());

app.use(morgan('dev'));

app.use('/auth', authRoutes);

app.get('/debug-sentry', function mainHandler() {
  throw new Error('Sentry Error');
});

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);
export default app;
