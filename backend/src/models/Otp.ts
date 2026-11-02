import mongoose, { Schema } from 'mongoose';

export type OtpPurpose = 'email_verification' | 'password_reset' | 'login_otp';

export interface IOtp {
  _id?: mongoose.Types.ObjectId | string;
  email: string;
  hashedCode: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  lastSentAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OtpSchema: Schema<IOtp> = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    hashedCode: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset', 'login_otp'],
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL index to automatically purge expired OTP documents from MongoDB
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast queries by email, purpose, and usage status
OtpSchema.index({ email: 1, purpose: 1, isUsed: 1 });

export const OtpModel: mongoose.Model<IOtp> =
  (mongoose.models.Otp as mongoose.Model<IOtp>) || mongoose.model<IOtp>('Otp', OtpSchema);
