import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { assertDbConnected } from '../config/database';
import { sendAuthenticationEmail } from './email.service';
import { env } from '../config/env';

export const generateToken = (id: string, email: string, name: string) => {
  return jwt.sign({ id, email, name }, env.JWT_SECRET, { expiresIn: '30d' });
};

export const generateSixDigitCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export class AuthService {
  async register(data: { name: string; email: string; password: string; preferredCurrency?: string }) {
    assertDbConnected();

    const { name, email, password, preferredCurrency } = data;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const currency = preferredCurrency || 'USD';

    const verificationCode = generateSixDigitCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw { statusCode: 400, message: 'An account with this email already exists.' };
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

    await sendAuthenticationEmail({
      to: cleanEmail,
      subject: 'Verify your FinTrack email address',
      title: 'Confirm Your Email Address',
      body: `Welcome to FinTrack, ${cleanName}! Please enter the following 6-digit security code to verify your account.`,
      code: verificationCode,
      actionText: 'Email Verification Code',
    });

    const token = generateToken(newUser._id.toString(), newUser.email, newUser.name);

    return {
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        jobTitle: newUser.jobTitle,
        preferredCurrency: newUser.preferredCurrency,
        isEmailVerified: false,
        monthlyIncomeTarget: newUser.monthlyIncomeTarget,
        alertThresholdPercent: newUser.alertThresholdPercent,
        createdAt: newUser.createdAt,
      },
    };
  }

  async login(email: string, password: string) {
    assertDbConnected();

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    const token = generateToken(user._id.toString(), user.email, user.name);

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        preferredCurrency: user.preferredCurrency,
        isEmailVerified: user.isEmailVerified,
        monthlyIncomeTarget: user.monthlyIncomeTarget,
        alertThresholdPercent: user.alertThresholdPercent,
        createdAt: user.createdAt,
      },
    };
  }

  async sendVerification(targetEmail: string) {
    assertDbConnected();

    const verificationCode = generateSixDigitCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      throw { statusCode: 404, message: 'No user account found for this email.' };
    }

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = verificationExpiry;
    await user.save();

    await sendAuthenticationEmail({
      to: targetEmail,
      subject: 'Your FinTrack Email Verification Code',
      title: 'Verify Your Email',
      body: `Hello ${user.name}, use the code below to verify your email address on FinTrack.`,
      code: verificationCode,
      actionText: 'Verification Code',
    });

    return {
      success: true,
      message: 'A fresh verification code has been dispatched to your email.',
    };
  }

  async verifyEmail(targetEmail: string, cleanCode: string) {
    assertDbConnected();

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      throw { statusCode: 404, message: 'No account found with this email address.' };
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== cleanCode) {
      throw { statusCode: 400, message: 'Invalid verification code. Please check your email and try again.' };
    }

    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      throw { statusCode: 400, message: 'Verification code has expired. Please request a fresh one.' };
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return {
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        preferredCurrency: user.preferredCurrency,
        isEmailVerified: true,
        monthlyIncomeTarget: user.monthlyIncomeTarget,
        alertThresholdPercent: user.alertThresholdPercent,
        createdAt: user.createdAt,
      },
    };
  }

  async forgotPassword(cleanEmail: string) {
    assertDbConnected();

    const resetCode = generateSixDigitCode();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw { statusCode: 404, message: 'No account registered with this email address.' };
    }

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetExpiry;
    await user.save();

    await sendAuthenticationEmail({
      to: cleanEmail,
      subject: 'Reset your FinTrack password',
      title: 'Password Reset Request',
      body: `We received a request to reset the password for your FinTrack account. Enter the 6-digit code below to set a new password.`,
      code: resetCode,
      actionText: 'Password Reset Code',
    });

    return {
      success: true,
      message: 'Password reset code dispatched to your email.',
    };
  }

  async resetPassword(cleanEmail: string, cleanCode: string, newPassword: string) {
    assertDbConnected();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw { statusCode: 404, message: 'No account found with this email.' };
    }

    if (!user.passwordResetCode || user.passwordResetCode !== cleanCode) {
      throw { statusCode: 400, message: 'Invalid reset code. Please check the latest code in your email.' };
    }

    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
      throw { statusCode: 400, message: 'Reset code has expired. Please request a new one.' };
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return {
      success: true,
      message: 'Password has been successfully updated. You can now log in.',
    };
  }

  async sendOtpLogin(cleanEmail: string) {
    assertDbConnected();

    const otpCode = generateSixDigitCode();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw { statusCode: 404, message: 'No account found for this email. Please register first.' };
    }

    user.loginOtpCode = otpCode;
    user.loginOtpExpires = otpExpiry;
    await user.save();

    await sendAuthenticationEmail({
      to: cleanEmail,
      subject: 'Your FinTrack Login Code',
      title: 'Sign In with Email Code',
      body: `Hello ${user.name}, use the one-time code below to sign in directly to your FinTrack workspace without entering your password.`,
      code: otpCode,
      actionText: 'One-Time Login Code',
    });

    return {
      success: true,
      message: 'One-time login code sent to your email.',
    };
  }

  async verifyOtpLogin(cleanEmail: string, cleanCode: string) {
    assertDbConnected();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw { statusCode: 404, message: 'Account not found.' };
    }

    if (!user.loginOtpCode || user.loginOtpCode !== cleanCode) {
      throw { statusCode: 400, message: 'Invalid login code. Please check your email.' };
    }

    if (user.loginOtpExpires && new Date() > user.loginOtpExpires) {
      throw { statusCode: 400, message: 'Login code has expired. Please request a new one.' };
    }

    user.isEmailVerified = true;
    user.loginOtpCode = undefined;
    user.loginOtpExpires = undefined;
    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.name);

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        preferredCurrency: user.preferredCurrency,
        isEmailVerified: true,
        monthlyIncomeTarget: user.monthlyIncomeTarget,
        alertThresholdPercent: user.alertThresholdPercent,
        createdAt: user.createdAt,
      },
    };
  }

  async getMe(userId: string) {
    assertDbConnected();

    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw { statusCode: 404, message: 'User profile not found.' };
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      preferredCurrency: user.preferredCurrency,
      isEmailVerified: user.isEmailVerified,
      monthlyIncomeTarget: user.monthlyIncomeTarget,
      alertThresholdPercent: user.alertThresholdPercent,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    updates: {
      name?: string;
      jobTitle?: string;
      preferredCurrency?: string;
      monthlyIncomeTarget?: number;
      alertThresholdPercent?: number;
    }
  ) {
    assertDbConnected();

    const { name, jobTitle, preferredCurrency, monthlyIncomeTarget, alertThresholdPercent } = updates;
    const toUpdate: any = {};

    if (name) toUpdate.name = name.trim();
    if (jobTitle !== undefined) toUpdate.jobTitle = jobTitle;
    if (preferredCurrency) toUpdate.preferredCurrency = preferredCurrency;
    if (monthlyIncomeTarget !== undefined) toUpdate.monthlyIncomeTarget = monthlyIncomeTarget;
    if (alertThresholdPercent !== undefined) toUpdate.alertThresholdPercent = alertThresholdPercent;

    const updated = await User.findByIdAndUpdate(userId, toUpdate, { new: true }).select('-password');
    if (!updated) {
      throw { statusCode: 404, message: 'User profile not found.' };
    }

    return {
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      jobTitle: updated.jobTitle,
      preferredCurrency: updated.preferredCurrency,
      isEmailVerified: updated.isEmailVerified,
      monthlyIncomeTarget: updated.monthlyIncomeTarget,
      alertThresholdPercent: updated.alertThresholdPercent,
      createdAt: updated.createdAt,
    };
  }
}

export const authService = new AuthService();
