import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authRateLimiter, otpRateLimiter } from '../common/middleware/rateLimiter.middleware';

const router = Router();

// DB status
router.get('/db-status', authController.getDbStatus.bind(authController));

// Authentication flows with targeted rate limiting
router.post('/register', authRateLimiter, authController.register.bind(authController));
router.post('/login', authRateLimiter, authController.login.bind(authController));
router.post('/send-verification', otpRateLimiter, authController.sendVerification.bind(authController));
router.post('/resend-verification', otpRateLimiter, authController.sendVerification.bind(authController));
router.post('/verify-email', authRateLimiter, authController.verifyEmail.bind(authController));
router.post('/forgot-password', otpRateLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', authRateLimiter, authController.resetPassword.bind(authController));
router.post('/send-otp-login', otpRateLimiter, authController.sendOtpLogin.bind(authController));
router.post('/verify-otp-login', authRateLimiter, authController.verifyOtpLogin.bind(authController));

// Authenticated user profile routes
router.get('/me', authenticateToken, authController.getMe.bind(authController));
router.put('/profile', authenticateToken, authController.updateProfile.bind(authController));

export default router;
