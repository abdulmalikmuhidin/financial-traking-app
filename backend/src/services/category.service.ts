import { CategoryModel } from '../models/Category';
import { TransactionModel } from '../models/Transaction';
import { assertDbConnected } from '../config/database';

export interface CreateCategoryDto {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export class CategoryService {
  async getAll(userId?: string) {
    assertDbConnected();

    const query = userId 
      ? { $or: [{ isDefault: true }, { userId }] }
      : { isDefault: true };

    const docs = await CategoryModel.find(query);
    return docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      icon: d.icon,
      color: d.color,
      isDefault: d.isDefault,
      userId: d.userId,
    }));
  }

  async create(userId: string, data: CreateCategoryDto) {
    assertDbConnected();

    const { name, type, icon, color } = data;
    const newId = `cat-${Date.now()}`;

    const doc = new CategoryModel({
      id: newId,
      name: name.trim(),
      type,
      icon: icon || 'Tag',
      color: color || '#3B82F6',
      isDefault: false,
      userId,
    });

    await doc.save();
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      icon: doc.icon,
      color: doc.color,
      isDefault: doc.isDefault,
      userId: doc.userId,
    };
  }

  async delete(userId: string, id: string) {
    assertDbConnected();

    const txCount = await TransactionModel.countDocuments({ categoryId: id, userId });
    if (txCount > 0) {
      throw { statusCode: 400, message: `Cannot delete: ${txCount} transactions use this category.` };
    }

    const deleted = await CategoryModel.findOneAndDelete({ id, userId, isDefault: false });
    if (!deleted) {
      throw { statusCode: 400, message: 'Cannot delete default category or category not found.' };
    }

    return { success: true };
  }
}

export const categoryService = new CategoryService();
