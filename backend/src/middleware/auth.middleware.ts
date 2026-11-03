import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../common/errors/AppError';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  if (!token) {
    return next(new UnauthorizedError('Access token required. Please sign in.'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ForbiddenError('Invalid or expired session token. Please sign in again.'));
  }
};
