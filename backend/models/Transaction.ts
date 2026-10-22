import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  categoryId: string;
  date: string;
  description: string;
  merchant?: string;
  paymentMethod: string;
  notes?: string;
  isRecurring?: boolean;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    categoryId: { type: String, required: true },
    date: { type: String, required: true },
    description: { type: String, required: true },
    merchant: { type: String },
    paymentMethod: { type: String, default: 'Credit Card' },
    notes: { type: String },
    isRecurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TransactionModel = 
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
