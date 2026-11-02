import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { assertDbConnected } from '../config/database';
import { otpService } from './otp.service';
import { env } from '../config/env';

export const generateToken = (id: string, email: string, name: string) => {
  return jwt.sign({ id, email, name }, env.JWT_SECRET, { expiresIn: '30d' });
};

export class AuthService {
  async register(data: { name: string; email: string; password: string; preferredCurrency?: string }) {
    assertDbConnected();

    const { name, email, password, preferredCurrency } = data;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const currency = preferredCurrency || 'USD';

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
    });

    await newUser.save();

    // Securely generate, hash, and email the OTP verification code
    await otpService.createAndSendOtp(cleanEmail, 'email_verification', cleanName);

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

    const cleanEmail = targetEmail.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw { statusCode: 404, message: 'No user account found for this email.' };
    }

    const result = await otpService.createAndSendOtp(cleanEmail, 'email_verification', user.name);

    return {
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
    };
  }

  async verifyEmail(targetEmail: string, cleanCode: string) {
    assertDbConnected();

    const cleanEmail = targetEmail.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw { statusCode: 404, message: 'No account found with this email address.' };
    }

    // Verify OTP securely against hashed database record
    await otpService.verifyOtp(cleanEmail, cleanCode, 'email_verification');

    user.isEmailVerified = true;
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

    const email = cleanEmail.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      throw { statusCode: 404, message: 'No account registered with this email address.' };
    }

    const result = await otpService.createAndSendOtp(email, 'password_reset', user.name);

    return {
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
    };
  }

  async resetPassword(cleanEmail: string, cleanCode: string, newPassword: string) {
    assertDbConnected();

    const email = cleanEmail.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      throw { statusCode: 404, message: 'No account found with this email.' };
    }

    // Verify OTP securely against hashed database record
    await otpService.verifyOtp(email, cleanCode, 'password_reset');

    user.password = newPassword;
    await user.save();

    return {
      success: true,
      message: 'Password has been successfully updated. You can now log in.',
    };
  }

  async sendOtpLogin(cleanEmail: string) {
    assertDbConnected();

    const email = cleanEmail.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      throw { statusCode: 404, message: 'No account found for this email. Please register first.' };
    }

    const result = await otpService.createAndSendOtp(email, 'login_otp', user.name);

    return {
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
    };
  }

  async verifyOtpLogin(cleanEmail: string, cleanCode: string) {
    assertDbConnected();

    const email = cleanEmail.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      throw { statusCode: 404, message: 'Account not found.' };
    }

    // Verify OTP securely against hashed database record
    await otpService.verifyOtp(email, cleanCode, 'login_otp');

    user.isEmailVerified = true;
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

  // Static proxy helpers allowing both AuthService.method() and authService.method()
  static register(data: { name: string; email: string; password: string; preferredCurrency?: string }) {
    return authService.register(data);
  }
  static login(email: string, password: string) {
    return authService.login(email, password);
  }
  static sendVerification(targetEmail: string) {
    return authService.sendVerification(targetEmail);
  }
  static verifyEmail(targetEmail: string, cleanCode: string) {
    return authService.verifyEmail(targetEmail, cleanCode);
  }
  static forgotPassword(cleanEmail: string) {
    return authService.forgotPassword(cleanEmail);
  }
  static resetPassword(cleanEmail: string, cleanCode: string, newPassword: string) {
    return authService.resetPassword(cleanEmail, cleanCode, newPassword);
  }
  static sendOtpLogin(cleanEmail: string) {
    return authService.sendOtpLogin(cleanEmail);
  }
  static verifyOtpLogin(cleanEmail: string, cleanCode: string) {
    return authService.verifyOtpLogin(cleanEmail, cleanCode);
  }
  static getMe(userId: string) {
    return authService.getMe(userId);
  }
  static updateProfile(userId: string, updates: any) {
    return authService.updateProfile(userId, updates);
  }
}

export const authService = new AuthService();
