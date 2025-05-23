import express from 'express';
import cors from 'cors'

import { errorHandler } from './middlewares/errorHandler';
import otpRoutes from './routes/otp'

const app = express();

app.use(cors())

app.use(express.json());

app.use("/otp", otpRoutes);

app.use(errorHandler);

export default app;