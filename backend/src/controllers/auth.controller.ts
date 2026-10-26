import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service';
import { AuthValidator } from '../validators/auth.validator';
import { AuthRequest } from '../types';
import { getDbStatus } from '../config/database';
import { env } from '../config/env';

export class AuthController {
  getDbStatus(req: Request, res: Response) {
    const status = getDbStatus();
    res.json(status);
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validationError = AuthValidator.validateRegister(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Registration failed due to an internal server error.' });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validationError = AuthValidator.validateLogin(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const result = await authService.login(req.body.email, req.body.password);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed due to an internal server error.' });
    }
  }

  async sendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      let targetEmail = req.body.email ? req.body.email.trim().toLowerCase() : '';

      const authHeader = req.headers['authorization'];
      if (!targetEmail && authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET) as any;
          targetEmail = decoded.email.toLowerCase();
        } catch {}
      }

      if (!targetEmail) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      const result = await authService.sendVerification(targetEmail);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Send verification error:', err);
      return res.status(500).json({ error: 'Failed to send verification email.' });
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
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
        return res.status(400).json({ error: validationError });
      }

      const cleanCode = code.toString().trim();
      const result = await authService.verifyEmail(targetEmail, cleanCode);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Verify email error:', err);
      return res.status(500).json({ error: 'Failed to verify email address.' });
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validationError = AuthValidator.validateEmailOnly(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const cleanEmail = req.body.email.trim().toLowerCase();
      const result = await authService.forgotPassword(cleanEmail);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Failed to process password reset request.' });
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validationError = AuthValidator.validateResetPassword(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const cleanEmail = req.body.email.trim().toLowerCase();
      const cleanCode = req.body.code.toString().trim();
      const result = await authService.resetPassword(cleanEmail, cleanCode, req.body.newPassword);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Reset password error:', err);
      return res.status(500).json({ error: 'Failed to reset password.' });
    }
  }

  async sendOtpLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const validationError = AuthValidator.validateEmailOnly(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const cleanEmail = req.body.email.trim().toLowerCase();
      const result = await authService.sendOtpLogin(cleanEmail);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Send OTP login error:', err);
      return res.status(500).json({ error: 'Failed to send one-time login code.' });
    }
  }

  async verifyOtpLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const validationError = AuthValidator.validateOtpLogin(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const cleanEmail = req.body.email.trim().toLowerCase();
      const cleanCode = req.body.code.toString().trim();
      const result = await authService.verifyOtpLogin(cleanEmail, cleanCode);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Verify OTP login error:', err);
      return res.status(500).json({ error: 'Failed to verify login code.' });
    }
  }

  demo(req: Request, res: Response) {
    const result = authService.getDemoUser();
    return res.json(result);
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await authService.getMe(userId);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await authService.updateProfile(userId, req.body);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to update profile.' });
    }
  }
}

export const authController = new AuthController();
