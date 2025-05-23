import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import otpRoutes from './routes/otp'

const app = express();

app.use(express.json());

app.use("/otp", otpRoutes);

app.use(errorHandler);

export default app;