import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  jobTitle?: string;
  preferredCurrency: string;
  isDemoUser: boolean;
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  loginOtpCode?: string;
  loginOtpExpires?: Date;
  monthlyIncomeTarget?: number;
  alertThresholdPercent?: number;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    jobTitle: { type: String, default: 'Personal Account' },
    preferredCurrency: { type: String, default: 'USD' },
    isDemoUser: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetCode: { type: String },
    passwordResetExpires: { type: Date },
    loginOtpCode: { type: String },
    loginOtpExpires: { type: Date },
    monthlyIncomeTarget: { type: Number, default: 5000 },
    alertThresholdPercent: { type: Number, default: 80 },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  const user = this as any;
  if (!user.isModified('password') || !user.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
