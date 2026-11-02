import crypto from 'crypto';
import { OtpModel, OtpPurpose } from '../models/Otp';
import { sendAuthenticationEmail } from './email.service';
import { env } from '../config/env';

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
export const RESEND_COOLDOWN_SECONDS = 60;
export const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_SECONDS * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;

export class OtpService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP.
   */
  generateCryptographicOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes the plain OTP code using SHA-256 and an optional HMAC/secret salt.
   */
  hashOtp(code: string): string {
    return crypto
      .createHash('sha256')
      .update(`${code}:${env.JWT_SECRET}`)
      .digest('hex');
  }

  /**
   * Constant-time comparison between user input and stored hash to prevent timing attacks.
   */
  verifyOtpHash(plainCode: string, storedHashedCode: string): boolean {
    const computedHash = this.hashOtp(plainCode.trim());
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHashedCode, 'hex');

    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  }

  /**
   * Generates, securely stores, and emails an OTP directly to the user.
   * Enforces resend cooldown, invalidates previous codes, and rolls back on email failure.
   */
  async createAndSendOtp(
    email: string,
    purpose: OtpPurpose,
    recipientName?: string
  ): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const cleanEmail = email.trim().toLowerCase();
    const now = new Date();

    // 1. Enforce Resend Cooldown
    const latestActive = await OtpModel.findOne({
      email: cleanEmail,
      purpose,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (latestActive && latestActive.lastSentAt) {
      const elapsed = now.getTime() - latestActive.lastSentAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw {
          statusCode: 429,
          message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        };
      }
    }

    // 2. Invalidate any existing active codes for this user & purpose
    await OtpModel.updateMany(
      { email: cleanEmail, purpose, isUsed: false },
      { $set: { isUsed: true } }
    );

    // 3. Generate cryptographic 6-digit code and hash it
    const plainCode = this.generateCryptographicOtp();
    const hashedCode = this.hashOtp(plainCode);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    // 4. Save new OTP record in MongoDB (plaintext code is NEVER saved)
    const otpDoc = new OtpModel({
      email: cleanEmail,
      hashedCode,
      purpose,
      expiresAt,
      attempts: 0,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      isUsed: false,
      lastSentAt: now,
    });
    await otpDoc.save();

    // 5. Dispatch email with plain code directly to user's registered inbox
    const emailDetails = this.getEmailDetails(purpose, recipientName || 'there');

    try {
      await sendAuthenticationEmail({
        to: cleanEmail,
        subject: emailDetails.subject,
        title: emailDetails.title,
        body: emailDetails.body,
        code: plainCode,
        actionText: emailDetails.actionText,
      });

      return {
        success: true,
        message: 'Security code successfully dispatched to your email address.',
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      };
    } catch (err: any) {
      // 6. Rollback: delete the active OTP document if email dispatch failed
      await OtpModel.findByIdAndDelete(otpDoc._id);
      console.error(`[OTP Rollback] Rolled back OTP for ${cleanEmail} because email dispatch failed:`, err?.message || err);
      throw err;
    }
  }

  /**
   * Validates submitted OTP against hashed DB record with attempt limits and single-use enforcement.
   */
  async verifyOtp(email: string, plainCode: string, purpose: OtpPurpose): Promise<{ valid: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = plainCode ? plainCode.toString().trim() : '';

    if (!cleanCode || cleanCode.length !== 6) {
      throw { statusCode: 400, message: 'Please enter a valid 6-digit verification code.' };
    }

    // Find the latest active OTP for this email and purpose
    const otpDoc = await OtpModel.findOne({
      email: cleanEmail,
      purpose,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      throw {
        statusCode: 400,
        message: 'No active verification code found. Please request a new one.',
      };
    }

    // Check expiration
    if (new Date() > otpDoc.expiresAt) {
      otpDoc.isUsed = true;
      await otpDoc.save();
      throw {
        statusCode: 400,
        message: 'Verification code has expired. Please request a fresh code.',
      };
    }

    // Check attempt limits
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      otpDoc.isUsed = true;
      await otpDoc.save();
      throw {
        statusCode: 400,
        message: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Constant-time hash comparison
    const isMatch = this.verifyOtpHash(cleanCode, otpDoc.hashedCode);

    if (!isMatch) {
      otpDoc.attempts += 1;
      if (otpDoc.attempts >= otpDoc.maxAttempts) {
        otpDoc.isUsed = true;
      }
      await otpDoc.save();

      const remaining = otpDoc.maxAttempts - otpDoc.attempts;
      if (remaining <= 0) {
        throw {
          statusCode: 400,
          message: 'Maximum verification attempts exceeded. Please request a new code.',
        };
      }

      throw {
        statusCode: 400,
        message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    // Mark as single-use
    otpDoc.isUsed = true;
    await otpDoc.save();

    return { valid: true };
  }

  private getEmailDetails(purpose: OtpPurpose, name: string) {
    switch (purpose) {
      case 'email_verification':
        return {
          subject: 'Verify your FinTrack email address',
          title: 'Confirm Your Email Address',
          body: `Welcome to FinTrack, ${name}! Please enter the 6-digit security code below to verify your account.`,
          actionText: 'Email Verification Code',
        };
      case 'password_reset':
        return {
          subject: 'Reset your FinTrack password',
          title: 'Password Reset Request',
          body: `We received a request to reset your FinTrack password. Enter the 6-digit code below to set a new password.`,
          actionText: 'Password Reset Code',
        };
      case 'login_otp':
        return {
          subject: 'Your FinTrack Login Code',
          title: 'Sign In with Email Code',
          body: `Hello ${name}, use the one-time code below to sign in directly to your FinTrack workspace without entering your password.`,
          actionText: 'One-Time Login Code',
        };
    }
  }
}

export const otpService = new OtpService();

