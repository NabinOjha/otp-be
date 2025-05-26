import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OtpService } from '../services/otp';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const otpService = new OtpService(req.body.phoneNumber);
    await otpService.send();

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
    const otpService = new OtpService(req.body.phoneNumber);
    const result = await otpService.verify(req.body.otp);

    if (result.isValid && result.otpRecord) {
      const token = jwt.sign(
        { phone: result.otpRecord.phone },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
      );

      res.cookie('ncell_jwt_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: 'OTP verified successfully' });
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    next(err);
  }
};

export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.ncell_jwt_token;

  if (!token) {
    return next(new Error('Unauthorized'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const phone = decoded.phone;

    const otp = await prisma.user.findFirst({
      where: { phone },
    });

    if (!otp) throw new Error('User not found');

    res.status(200).json(otp);
  } catch (err) {
    next(err);
  }
};

export const signOut = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie('ncell_jwt_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
