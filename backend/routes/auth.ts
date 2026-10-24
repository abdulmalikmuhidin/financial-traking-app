import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { getDbStatus } from '../db';
import { fallbackStore } from '../fallbackStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendAuthenticationEmail } from '../emailService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fintrack_jwt_default_secret_key_2026';

const generateToken = (id: string, email: string, name: string) => {
  return jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '30d' });
};

const generateSixDigitCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// GET DB status
router.get('/db-status', (req: Request, res: Response) => {
  const status = getDbStatus();
  res.json(status);
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, preferredCurrency } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const currency = preferredCurrency || 'USD';
    const status = getDbStatus();

    const verificationCode = generateSixDigitCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // 1. Try MongoDB if connected
    if (status.isConnected) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const newUser = new User({
        name: cleanName,
        email: cleanEmail,
        password,
        preferredCurrency: currency,
        jobTitle: 'Personal Account',
        monthlyIncomeTarget: 5000,
        alertThresholdPercent: 80,
        isEmailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpiry,
      });

      await newUser.save();

      // Dispatch security verification email
      const emailRes = await sendAuthenticationEmail({
        to: cleanEmail,
        subject: 'Verify your FinTrack email address',
        title: 'Confirm Your Email Address',
        body: `Welcome to FinTrack, ${cleanName}! Please enter the following 6-digit security code to verify your account.`,
        code: verificationCode,
        actionText: 'Email Verification Code',
      });

      const token = generateToken(newUser._id.toString(), newUser.email, newUser.name);

      return res.status(201).json({
        token,
        previewCode: emailRes.previewCode,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          jobTitle: newUser.jobTitle,
          preferredCurrency: newUser.preferredCurrency,
          isDemoUser: false,
          isEmailVerified: false,
          monthlyIncomeTarget: newUser.monthlyIncomeTarget,
          alertThresholdPercent: newUser.alertThresholdPercent,
          createdAt: newUser.createdAt,
        },
      });
    }

    // 2. Fallback store
    const existingInFallback = fallbackStore.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingInFallback) {
      return res.status(400).json({ error: 'An account with this email already exists in local registry.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newId = `user-${Date.now()}`;

    const newStoredUser = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      jobTitle: 'Personal Account',
      preferredCurrency: currency,
      isDemoUser: false,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpiry.toISOString(),
      monthlyIncomeTarget: 5000,
      alertThresholdPercent: 80,
      createdAt: new Date().toISOString(),
    };

    fallbackStore.users.push(newStoredUser);

    const emailRes = await sendAuthenticationEmail({
      to: cleanEmail,
      subject: 'Verify your FinTrack email address',
      title: 'Confirm Your Email Address',
      body: `Welcome to FinTrack, ${cleanName}! Please enter the following 6-digit security code to verify your account.`,
      code: verificationCode,
      actionText: 'Email Verification Code',
    });

    const token = generateToken(newId, cleanEmail, cleanName);

    return res.status(201).json({
      token,
      previewCode: emailRes.previewCode,
      user: {
        id: newStoredUser.id,
        name: newStoredUser.name,
        email: newStoredUser.email,
        jobTitle: newStoredUser.jobTitle,
        preferredCurrency: newStoredUser.preferredCurrency,
        isDemoUser: false,
        isEmailVerified: false,
        monthlyIncomeTarget: newStoredUser.monthlyIncomeTarget,
        alertThresholdPercent: newStoredUser.alertThresholdPercent,
        createdAt: newStoredUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed due to an internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const status = getDbStatus();

    // Check MongoDB first
    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = generateToken(user._id.toString(), user.email, user.name);

      return res.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          preferredCurrency: user.preferredCurrency,
          isDemoUser: user.isDemoUser,
          isEmailVerified: !!user.isEmailVerified,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        },
      });
    }

    // Check Fallback store
    const user = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Try Demo Account or register.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = generateToken(user.id, user.email, user.name);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        preferredCurrency: user.preferredCurrency,
        isDemoUser: user.isDemoUser,
        isEmailVerified: !!user.isEmailVerified,
        monthlyIncomeTarget: user.monthlyIncomeTarget,
        alertThresholdPercent: user.alertThresholdPercent,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed due to an internal server error.' });
  }
});

// POST /api/auth/send-verification (resend verification email)
router.post('/send-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    let targetEmail = email ? email.trim().toLowerCase() : '';

    // If request contains Bearer token and no email supplied
    const authHeader = req.headers['authorization'];
    if (!targetEmail && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
        targetEmail = decoded.email.toLowerCase();
      } catch {}
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const verificationCode = generateSixDigitCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: targetEmail });
      if (!user) {
        return res.status(404).json({ error: 'No user account found for this email.' });
      }

      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpires = verificationExpiry;
      await user.save();

      const emailRes = await sendAuthenticationEmail({
        to: targetEmail,
        subject: 'Your FinTrack Email Verification Code',
        title: 'Verify Your Email',
        body: `Hello ${user.name}, use the code below to verify your email address on FinTrack.`,
        code: verificationCode,
        actionText: 'Verification Code',
      });

      return res.json({
        success: true,
        message: 'A fresh verification code has been dispatched to your email.',
        previewCode: emailRes.previewCode,
      });
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!fallbackUser) {
      return res.status(404).json({ error: 'No user account found for this email.' });
    }

    fallbackUser.emailVerificationCode = verificationCode;
    fallbackUser.emailVerificationExpires = verificationExpiry.toISOString();

    const emailRes = await sendAuthenticationEmail({
      to: targetEmail,
      subject: 'Your FinTrack Email Verification Code',
      title: 'Verify Your Email',
      body: `Hello ${fallbackUser.name}, use the code below to verify your email address on FinTrack.`,
      code: verificationCode,
      actionText: 'Verification Code',
    });

    return res.json({
      success: true,
      message: 'A fresh verification code has been dispatched to your email.',
      previewCode: emailRes.previewCode,
    });
  } catch (err: any) {
    console.error('Send verification error:', err);
    return res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    let targetEmail = email ? email.trim().toLowerCase() : '';

    const authHeader = req.headers['authorization'];
    if (!targetEmail && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
        targetEmail = decoded.email.toLowerCase();
      } catch {}
    }

    if (!targetEmail || !code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const cleanCode = code.toString().trim();
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: targetEmail });
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      if (user.isEmailVerified) {
        return res.json({
          success: true,
          message: 'Email is already verified.',
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isEmailVerified: true,
            preferredCurrency: user.preferredCurrency,
          },
        });
      }

      if (!user.emailVerificationCode || user.emailVerificationCode !== cleanCode) {
        return res.status(400).json({ error: 'Invalid verification code. Please check your email.' });
      }

      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
      }

      user.isEmailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return res.json({
        success: true,
        message: 'Email address verified successfully!',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          preferredCurrency: user.preferredCurrency,
          isDemoUser: user.isDemoUser,
          isEmailVerified: true,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        },
      });
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!fallbackUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (fallbackUser.isEmailVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified.',
        user: {
          id: fallbackUser.id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          isEmailVerified: true,
          preferredCurrency: fallbackUser.preferredCurrency,
        },
      });
    }

    if (!fallbackUser.emailVerificationCode || fallbackUser.emailVerificationCode !== cleanCode) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email.' });
    }

    if (fallbackUser.emailVerificationExpires && new Date() > new Date(fallbackUser.emailVerificationExpires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    fallbackUser.isEmailVerified = true;
    fallbackUser.emailVerificationCode = undefined;
    fallbackUser.emailVerificationExpires = undefined;

    return res.json({
      success: true,
      message: 'Email address verified successfully!',
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        jobTitle: fallbackUser.jobTitle,
        preferredCurrency: fallbackUser.preferredCurrency,
        isDemoUser: fallbackUser.isDemoUser,
        isEmailVerified: true,
        monthlyIncomeTarget: fallbackUser.monthlyIncomeTarget,
        alertThresholdPercent: fallbackUser.alertThresholdPercent,
        createdAt: fallbackUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Verify email error:', err);
    return res.status(500).json({ error: 'Failed to verify email address.' });
  }
});

// POST /api/auth/forgot-password (request password reset code)
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const resetCode = generateSixDigitCode();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ error: 'No account registered with this email address.' });
      }

      user.passwordResetCode = resetCode;
      user.passwordResetExpires = resetExpiry;
      await user.save();

      const emailRes = await sendAuthenticationEmail({
        to: cleanEmail,
        subject: 'Reset your FinTrack password',
        title: 'Password Reset Request',
        body: `We received a request to reset the password for your FinTrack account. Enter the 6-digit code below to set a new password.`,
        code: resetCode,
        actionText: 'Password Reset Code',
      });

      return res.json({
        success: true,
        message: 'Password reset code dispatched to your email.',
        previewCode: emailRes.previewCode,
      });
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    fallbackUser.passwordResetCode = resetCode;
    fallbackUser.passwordResetExpires = resetExpiry.toISOString();

    const emailRes = await sendAuthenticationEmail({
      to: cleanEmail,
      subject: 'Reset your FinTrack password',
      title: 'Password Reset Request',
      body: `We received a request to reset the password for your FinTrack account. Enter the 6-digit code below to set a new password.`,
      code: resetCode,
      actionText: 'Password Reset Code',
    });

    return res.json({
      success: true,
      message: 'Password reset code dispatched to your email.',
      previewCode: emailRes.previewCode,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/reset-password (submit code & new password)
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email.' });
      }

      if (!user.passwordResetCode || user.passwordResetCode !== cleanCode) {
        return res.status(400).json({ error: 'Invalid reset code. Please check your email.' });
      }

      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
      }

      // Update password
      user.password = newPassword;
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      const token = generateToken(user._id.toString(), user.email, user.name);

      return res.json({
        success: true,
        message: 'Password has been successfully updated!',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          preferredCurrency: user.preferredCurrency,
          isDemoUser: user.isDemoUser,
          isEmailVerified: !!user.isEmailVerified,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        },
      });
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    if (!fallbackUser.passwordResetCode || fallbackUser.passwordResetCode !== cleanCode) {
      return res.status(400).json({ error: 'Invalid reset code. Please check your email.' });
    }

    if (fallbackUser.passwordResetExpires && new Date() > new Date(fallbackUser.passwordResetExpires)) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    fallbackUser.passwordHash = await bcrypt.hash(newPassword, salt);
    fallbackUser.passwordResetCode = undefined;
    fallbackUser.passwordResetExpires = undefined;

    const token = generateToken(fallbackUser.id, fallbackUser.email, fallbackUser.name);

    return res.json({
      success: true,
      message: 'Password has been successfully updated!',
      token,
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        jobTitle: fallbackUser.jobTitle,
        preferredCurrency: fallbackUser.preferredCurrency,
        isDemoUser: fallbackUser.isDemoUser,
        isEmailVerified: !!fallbackUser.isEmailVerified,
        monthlyIncomeTarget: fallbackUser.monthlyIncomeTarget,
        alertThresholdPercent: fallbackUser.alertThresholdPercent,
        createdAt: fallbackUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// POST /api/auth/send-otp-login (passwordless login code)
router.post('/send-otp-login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = generateSixDigitCode();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ error: 'No account found for this email. Please create an account first.' });
      }

      user.loginOtpCode = otpCode;
      user.loginOtpExpires = otpExpiry;
      await user.save();

      const emailRes = await sendAuthenticationEmail({
        to: cleanEmail,
        subject: 'Your FinTrack Login Code',
        title: 'Sign In with Email Code',
        body: `Hello ${user.name}, use the one-time code below to sign in directly to your FinTrack workspace without entering your password.`,
        code: otpCode,
        actionText: 'One-Time Login Code',
      });

      return res.json({
        success: true,
        message: 'One-time login code sent to your email.',
        previewCode: emailRes.previewCode,
      });
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      return res.status(404).json({ error: 'No account found for this email. Please create an account first.' });
    }

    fallbackUser.loginOtpCode = otpCode;
    fallbackUser.loginOtpExpires = otpExpiry.toISOString();

    const emailRes = await sendAuthenticationEmail({
      to: cleanEmail,
      subject: 'Your FinTrack Login Code',
      title: 'Sign In with Email Code',
      body: `Hello ${fallbackUser.name}, use the one-time code below to sign in directly to your FinTrack workspace without entering your password.`,
      code: otpCode,
      actionText: 'One-Time Login Code',
    });

    return res.json({
      success: true,
      message: 'One-time login code sent to your email.',
      previewCode: emailRes.previewCode,
    });
  } catch (err: any) {
    console.error('Send OTP login error:', err);
    return res.status(500).json({ error: 'Failed to send one-time login code.' });
  }
});

// POST /api/auth/verify-otp-login (submit code to login)
router.post('/verify-otp-login', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit login code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ error: 'Account not found.' });
      }

      if (!user.loginOtpCode || user.loginOtpCode !== cleanCode) {
        return res.status(400).json({ error: 'Invalid login code. Please check your email.' });
      }

      if (user.loginOtpExpires && new Date() > user.loginOtpExpires) {
        return res.status(400).json({ error: 'Login code has expired. Please request a new one.' });
      }

      // Mark email as verified and clear OTP
      user.isEmailVerified = true;
      user.loginOtpCode = undefined;
      user.loginOtpExpires = undefined;
      await user.save();

      const token = generateToken(user._id.toString(), user.email, user.name);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          preferredCurrency: user.preferredCurrency,
          isDemoUser: user.isDemoUser,
          isEmailVerified: true,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        },
      });
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (!fallbackUser.loginOtpCode || fallbackUser.loginOtpCode !== cleanCode) {
      return res.status(400).json({ error: 'Invalid login code. Please check your email.' });
    }

    if (fallbackUser.loginOtpExpires && new Date() > new Date(fallbackUser.loginOtpExpires)) {
      return res.status(400).json({ error: 'Login code has expired. Please request a new one.' });
    }

    fallbackUser.isEmailVerified = true;
    fallbackUser.loginOtpCode = undefined;
    fallbackUser.loginOtpExpires = undefined;

    const token = generateToken(fallbackUser.id, fallbackUser.email, fallbackUser.name);

    return res.json({
      success: true,
      token,
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        jobTitle: fallbackUser.jobTitle,
        preferredCurrency: fallbackUser.preferredCurrency,
        isDemoUser: fallbackUser.isDemoUser,
        isEmailVerified: true,
        monthlyIncomeTarget: fallbackUser.monthlyIncomeTarget,
        alertThresholdPercent: fallbackUser.alertThresholdPercent,
        createdAt: fallbackUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Verify OTP login error:', err);
    return res.status(500).json({ error: 'Failed to verify login code.' });
  }
});

// POST /api/auth/demo
router.post('/demo', async (req: Request, res: Response) => {
  const demoUser = fallbackStore.users.find((u) => u.isDemoUser) || {
    id: 'user-demo-alex',
    name: 'Alex Morgan',
    email: 'alex.morgan@fintrack.app',
    jobTitle: 'Senior Product Designer',
    preferredCurrency: 'USD',
    isDemoUser: true,
    isEmailVerified: true,
    monthlyIncomeTarget: 8500,
    alertThresholdPercent: 80,
    createdAt: '2026-01-15T09:00:00Z',
  };

  const token = generateToken(demoUser.id, demoUser.email, demoUser.name);

  return res.json({
    token,
    user: demoUser,
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findById(userId).select('-password');
      if (user) {
        return res.json({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          preferredCurrency: user.preferredCurrency,
          isDemoUser: user.isDemoUser,
          isEmailVerified: !!user.isEmailVerified,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        });
      }
    }

    const user = fallbackStore.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      preferredCurrency: user.preferredCurrency,
      isDemoUser: user.isDemoUser,
      isEmailVerified: !!user.isEmailVerified,
      monthlyIncomeTarget: user.monthlyIncomeTarget,
      alertThresholdPercent: user.alertThresholdPercent,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, jobTitle, preferredCurrency, monthlyIncomeTarget, alertThresholdPercent } = req.body;
    const status = getDbStatus();

    if (status.isConnected) {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          ...(name ? { name: name.trim() } : {}),
          ...(jobTitle !== undefined ? { jobTitle } : {}),
          ...(preferredCurrency ? { preferredCurrency } : {}),
          ...(monthlyIncomeTarget !== undefined ? { monthlyIncomeTarget } : {}),
          ...(alertThresholdPercent !== undefined ? { alertThresholdPercent } : {}),
        },
        { new: true }
      ).select('-password');

      if (updated) {
        return res.json({
          id: updated._id.toString(),
          name: updated.name,
          email: updated.email,
          jobTitle: updated.jobTitle,
          preferredCurrency: updated.preferredCurrency,
          isDemoUser: updated.isDemoUser,
          isEmailVerified: !!updated.isEmailVerified,
          monthlyIncomeTarget: updated.monthlyIncomeTarget,
          alertThresholdPercent: updated.alertThresholdPercent,
          createdAt: updated.createdAt,
        });
      }
    }

    const idx = fallbackStore.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      if (name) fallbackStore.users[idx].name = name.trim();
      if (jobTitle !== undefined) fallbackStore.users[idx].jobTitle = jobTitle;
      if (preferredCurrency) fallbackStore.users[idx].preferredCurrency = preferredCurrency;
      if (monthlyIncomeTarget !== undefined) fallbackStore.users[idx].monthlyIncomeTarget = monthlyIncomeTarget;
      if (alertThresholdPercent !== undefined) fallbackStore.users[idx].alertThresholdPercent = alertThresholdPercent;

      const u = fallbackStore.users[idx];
      return res.json({
        id: u.id,
        name: u.name,
        email: u.email,
        jobTitle: u.jobTitle,
        preferredCurrency: u.preferredCurrency,
        isDemoUser: u.isDemoUser,
        isEmailVerified: !!u.isEmailVerified,
        monthlyIncomeTarget: u.monthlyIncomeTarget,
        alertThresholdPercent: u.alertThresholdPercent,
        createdAt: u.createdAt,
      });
    }

    return res.status(404).json({ error: 'User profile not found.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
