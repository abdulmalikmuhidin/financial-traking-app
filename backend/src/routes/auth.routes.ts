import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// DB status
router.get('/db-status', authController.getDbStatus.bind(authController));

// Authentication flows
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/send-verification', authController.sendVerification.bind(authController));
router.post('/verify-email', authController.verifyEmail.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/send-otp-login', authController.sendOtpLogin.bind(authController));
router.post('/verify-otp-login', authController.verifyOtpLogin.bind(authController));
router.post('/demo', authController.demo.bind(authController));

// Authenticated user profile routes
router.get('/me', authenticateToken, authController.getMe.bind(authController));
router.put('/profile', authenticateToken, authController.updateProfile.bind(authController));

export default router;
