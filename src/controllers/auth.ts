import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken'

import { OtpService } from '../services/otp';

export const me = async (req: Request, res: Response, next: NextFunction) => {
  const otpServive = new OtpService(req.params.phoneNumber);
  await otpServive.resend();

  try {
    res.status(200).json({ message: 'OTP resent' });
  } catch (err) {
    next(err);
  }
};
