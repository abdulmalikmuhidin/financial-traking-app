import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  month: string;
  currency: string;
}

const BudgetSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true },
    monthlyLimit: { type: Number, required: true, min: 0 },
    month: { type: String, required: true },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

// Compound index so a user has one budget per category per month
BudgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

export const BudgetModel = 
  mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
