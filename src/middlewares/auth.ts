import jwt from 'jsonwebtoken';

import { Response, NextFunction, Request } from 'express';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const phoneNumber = await jwt.verify(token, process.env.JWT_SECRET!);
    req.phoneNumber = phoneNumber as string;
    next();
  } catch (error) {
    next(error);
  }
};
