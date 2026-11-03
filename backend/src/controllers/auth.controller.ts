import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service';
import { AuthValidator } from '../validators/auth.validator';
import { AuthRequest } from '../types';
import { getDbStatus } from '../config/database';
import { env } from '../config/env';
import { asyncHandler } from '../common/utils/asyncHandler';
import { BadRequestError } from '../common/errors/AppError';

export class AuthController {
  getDbStatus = (req: Request, res: Response) => {
    const status = getDbStatus();
    res.json(status);
  };

  register = asyncHandler(async (req: Request, res: Response) => {
    const validationError = AuthValidator.validateRegister(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const result = await authService.register(req.body);
    return res.status(201).json(result);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const validationError = AuthValidator.validateLogin(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const result = await authService.login(req.body.email, req.body.password);
    return res.json(result);
  });

  sendVerification = asyncHandler(async (req: Request, res: Response) => {
    let targetEmail = req.body.email ? req.body.email.trim().toLowerCase() : '';

    const authHeader = req.headers['authorization'];
    if (!targetEmail && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET) as any;
        targetEmail = decoded.email.toLowerCase();
      } catch {}
    }

    if (!targetEmail || !AuthValidator.isValidEmail(targetEmail)) {
      throw new BadRequestError('A valid email address is required.');
    }

    const result = await authService.sendVerification(targetEmail);
    return res.json(result);
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    let targetEmail = email ? email.trim().toLowerCase() : '';

    const authHeader = req.headers['authorization'];
    if (!targetEmail && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET) as any;
        targetEmail = decoded.email.toLowerCase();
      } catch {}
    }

    const validationError = AuthValidator.validateVerifyEmail(targetEmail, code);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const cleanCode = code.toString().trim();
    const result = await authService.verifyEmail(targetEmail, cleanCode);
    return res.json(result);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const validationError = AuthValidator.validateEmailOnly(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const cleanEmail = req.body.email.trim().toLowerCase();
    const result = await authService.forgotPassword(cleanEmail);
    return res.json(result);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const validationError = AuthValidator.validateResetPassword(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const cleanEmail = req.body.email.trim().toLowerCase();
    const cleanCode = req.body.code.toString().trim();
    const result = await authService.resetPassword(cleanEmail, cleanCode, req.body.newPassword);
    return res.json(result);
  });

  sendOtpLogin = asyncHandler(async (req: Request, res: Response) => {
    const validationError = AuthValidator.validateEmailOnly(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const cleanEmail = req.body.email.trim().toLowerCase();
    const result = await authService.sendOtpLogin(cleanEmail);
    return res.json(result);
  });

  verifyOtpLogin = asyncHandler(async (req: Request, res: Response) => {
    const validationError = AuthValidator.validateOtpLogin(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const cleanEmail = req.body.email.trim().toLowerCase();
    const cleanCode = req.body.code.toString().trim();
    const result = await authService.verifyOtpLogin(cleanEmail, cleanCode);
    return res.json(result);
  });

  getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await authService.getMe(userId);
    return res.json(result);
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await authService.updateProfile(userId, req.body);
    return res.json(result);
  });
}

export const authController = new AuthController();
