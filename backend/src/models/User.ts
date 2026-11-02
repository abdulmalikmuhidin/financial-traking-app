import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id?: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  password?: string;
  jobTitle?: string;
  preferredCurrency: string;
  isEmailVerified: boolean;
  monthlyIncomeTarget?: number;
  alertThresholdPercent?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const UserSchema: Schema<IUser, UserModel, IUserMethods> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    jobTitle: { type: String, default: 'Personal Account' },
    preferredCurrency: { type: String, default: 'USD' },
    isEmailVerified: { type: Boolean, default: false },
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

export const User = 
  (mongoose.models.User as UserModel) || mongoose.model<IUser, UserModel>('User', UserSchema);
