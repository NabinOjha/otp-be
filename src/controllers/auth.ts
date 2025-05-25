import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { OtpService } from '../services/otp';

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const otpServive = new OtpService(req.body.phoneNumber);
    await otpServive.send();

    res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    next(err);
  }
};

export const veifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const otpServive = new OtpService(req.body.phoneNumber);
    const result = await otpServive.verify(req.params.otp);

    if (result.isValid && result.otpRecord) {
      const token = jwt.sign(
        { phone: result.otpRecord.phone },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
      );
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    } else {
      next(new Error(result.message));
    }
    res.status(200).json({ message: 'OTP resent' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  const otpServive = new OtpService(req.params.phoneNumber);
  await otpServive.resend();

  try {
    res.status(200).json({ message: 'OTP resent' });
  } catch (err) {
    next(err);
  }
};
