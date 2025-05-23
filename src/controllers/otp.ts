import { Request, Response, NextFunction } from 'express';

export const sendOtp = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Hello from send-otp");
    res.status(200).json({ message: "OTP sent" });
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
