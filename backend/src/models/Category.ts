import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
}

const CategorySchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    userId: { type: String, index: true },
  },
  { timestamps: true }
);

export const CategoryModel = 
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
