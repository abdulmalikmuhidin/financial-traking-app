import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { getDbStatus } from '../config/database';
import { fallbackStore } from './fallbackStore.service';
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
    const { name, email, password, preferredCurrency } = data;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const currency = preferredCurrency || 'USD';
    const status = getDbStatus();

    const verificationCode = generateSixDigitCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (status.isConnected) {
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

      const emailRes = await sendAuthenticationEmail({
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
      };
    }

    // Fallback store
    const existingInFallback = fallbackStore.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingInFallback) {
      throw { statusCode: 400, message: 'An account with this email already exists in local registry.' };
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

    return {
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
    };
  }

  async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const status = getDbStatus();

    if (status.isConnected) {
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
          isDemoUser: user.isDemoUser,
          isEmailVerified: !!user.isEmailVerified,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        },
      };
    }

    const user = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw { statusCode: 401, message: 'No account found with this email. Try Demo Account or register.' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Incorrect password.' };
    }

    const token = generateToken(user.id, user.email, user.name);

    return {
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
    };
  }

  async sendVerification(targetEmail: string) {
    const verificationCode = generateSixDigitCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: targetEmail });
      if (!user) {
        throw { statusCode: 404, message: 'No user account found for this email.' };
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

      return {
        success: true,
        message: 'A fresh verification code has been dispatched to your email.',
        previewCode: emailRes.previewCode,
      };
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!fallbackUser) {
      throw { statusCode: 404, message: 'No user account found for this email.' };
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

    return {
      success: true,
      message: 'A fresh verification code has been dispatched to your email.',
      previewCode: emailRes.previewCode,
    };
  }

  async verifyEmail(targetEmail: string, cleanCode: string) {
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: targetEmail });
      if (!user) {
        throw { statusCode: 404, message: 'User account not found.' };
      }

      if (user.isEmailVerified) {
        return {
          success: true,
          message: 'Email is already verified.',
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isEmailVerified: true,
            preferredCurrency: user.preferredCurrency,
          },
        };
      }

      if (!user.emailVerificationCode || user.emailVerificationCode !== cleanCode) {
        throw { statusCode: 400, message: 'Invalid verification code. Please check your email.' };
      }

      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        throw { statusCode: 400, message: 'Verification code has expired. Please request a new one.' };
      }

      user.isEmailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return {
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
      };
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === targetEmail);
    if (!fallbackUser) {
      throw { statusCode: 404, message: 'User account not found.' };
    }

    if (fallbackUser.isEmailVerified) {
      return {
        success: true,
        message: 'Email is already verified.',
        user: {
          id: fallbackUser.id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          isEmailVerified: true,
          preferredCurrency: fallbackUser.preferredCurrency,
        },
      };
    }

    if (!fallbackUser.emailVerificationCode || fallbackUser.emailVerificationCode !== cleanCode) {
      throw { statusCode: 400, message: 'Invalid verification code. Please check your email.' };
    }

    if (fallbackUser.emailVerificationExpires && new Date() > new Date(fallbackUser.emailVerificationExpires)) {
      throw { statusCode: 400, message: 'Verification code has expired. Please request a new one.' };
    }

    fallbackUser.isEmailVerified = true;
    fallbackUser.emailVerificationCode = undefined;
    fallbackUser.emailVerificationExpires = undefined;

    return {
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
    };
  }

  async forgotPassword(cleanEmail: string) {
    const resetCode = generateSixDigitCode();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        throw { statusCode: 404, message: 'No account registered with this email address.' };
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

      return {
        success: true,
        message: 'Password reset code dispatched to your email.',
        previewCode: emailRes.previewCode,
      };
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      throw { statusCode: 404, message: 'No account registered with this email address.' };
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

    return {
      success: true,
      message: 'Password reset code dispatched to your email.',
      previewCode: emailRes.previewCode,
    };
  }

  async resetPassword(cleanEmail: string, cleanCode: string, newPassword: string) {
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        throw { statusCode: 404, message: 'No account found with this email.' };
      }

      if (!user.passwordResetCode || user.passwordResetCode !== cleanCode) {
        throw { statusCode: 400, message: 'Invalid reset code. Please check your email.' };
      }

      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        throw { statusCode: 400, message: 'Reset code has expired. Please request a new one.' };
      }

      user.password = newPassword;
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      const token = generateToken(user._id.toString(), user.email, user.name);

      return {
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
      };
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      throw { statusCode: 404, message: 'No account found with this email.' };
    }

    if (!fallbackUser.passwordResetCode || fallbackUser.passwordResetCode !== cleanCode) {
      throw { statusCode: 400, message: 'Invalid reset code. Please check your email.' };
    }

    if (fallbackUser.passwordResetExpires && new Date() > new Date(fallbackUser.passwordResetExpires)) {
      throw { statusCode: 400, message: 'Reset code has expired. Please request a new one.' };
    }

    const salt = await bcrypt.genSalt(10);
    fallbackUser.passwordHash = await bcrypt.hash(newPassword, salt);
    fallbackUser.passwordResetCode = undefined;
    fallbackUser.passwordResetExpires = undefined;

    const token = generateToken(fallbackUser.id, fallbackUser.email, fallbackUser.name);

    return {
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
    };
  }

  async sendOtpLogin(cleanEmail: string) {
    const otpCode = generateSixDigitCode();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        throw { statusCode: 404, message: 'No account found for this email. Please create an account first.' };
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

      return {
        success: true,
        message: 'One-time login code sent to your email.',
        previewCode: emailRes.previewCode,
      };
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      throw { statusCode: 404, message: 'No account found for this email. Please create an account first.' };
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

    return {
      success: true,
      message: 'One-time login code sent to your email.',
      previewCode: emailRes.previewCode,
    };
  }

  async verifyOtpLogin(cleanEmail: string, cleanCode: string) {
    const status = getDbStatus();

    if (status.isConnected) {
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
      };
    }

    const fallbackUser = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!fallbackUser) {
      throw { statusCode: 404, message: 'Account not found.' };
    }

    if (!fallbackUser.loginOtpCode || fallbackUser.loginOtpCode !== cleanCode) {
      throw { statusCode: 400, message: 'Invalid login code. Please check your email.' };
    }

    if (fallbackUser.loginOtpExpires && new Date() > new Date(fallbackUser.loginOtpExpires)) {
      throw { statusCode: 400, message: 'Login code has expired. Please request a new one.' };
    }

    fallbackUser.isEmailVerified = true;
    fallbackUser.loginOtpCode = undefined;
    fallbackUser.loginOtpExpires = undefined;

    const token = generateToken(fallbackUser.id, fallbackUser.email, fallbackUser.name);

    return {
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
    };
  }

  getDemoUser() {
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
    return { token, user: demoUser };
  }

  async getMe(userId: string) {
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findById(userId).select('-password');
      if (user) {
        return {
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
        };
      }
    }

    const user = fallbackStore.users.find((u) => u.id === userId);
    if (!user) {
      throw { statusCode: 404, message: 'User profile not found.' };
    }

    return {
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
    };
  }

  async updateProfile(userId: string, data: { name?: string; jobTitle?: string; preferredCurrency?: string; monthlyIncomeTarget?: number; alertThresholdPercent?: number }) {
    const { name, jobTitle, preferredCurrency, monthlyIncomeTarget, alertThresholdPercent } = data;
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
        return {
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
        };
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
      return {
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
      };
    }

    throw { statusCode: 404, message: 'User profile not found.' };
  }
}

export const authService = new AuthService();
