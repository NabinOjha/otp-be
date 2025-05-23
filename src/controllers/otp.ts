import { Request, Response, NextFunction } from 'express';
import db from '../db';

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const otps = await db.query.otps.findMany()

    res.status(200).json({ message: "OTP sent", otps: otps });
  } catch (err) {
    next(err);
  }
};

export const resendOtp = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Hello from resend-otp");
    res.status(200).json({ message: "OTP resent" });
  } catch (err) {
    next(err);
  }
};
