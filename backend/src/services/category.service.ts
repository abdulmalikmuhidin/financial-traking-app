import { CategoryModel } from '../models/Category';
import { TransactionModel } from '../models/Transaction';
import { getDbStatus } from '../config/database';
import { fallbackStore } from './fallbackStore.service';

export interface CreateCategoryDto {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export class CategoryService {
  async getAll(userId?: string) {
    const status = getDbStatus();

    if (status.isConnected) {
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

    return fallbackStore.categories.filter((c) => c.isDefault || c.userId === userId);
  }

  async create(userId: string, data: CreateCategoryDto) {
    const { name, type, icon, color } = data;
    const newId = `cat-${Date.now()}`;
    const status = getDbStatus();

    if (status.isConnected) {
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
      return doc;
    }

    const newCat = {
      id: newId,
      name: name.trim(),
      type,
      icon: icon || 'Tag',
      color: color || '#3B82F6',
      isDefault: false,
      userId,
    };

    fallbackStore.categories.push(newCat);
    return newCat;
  }

  async delete(userId: string, id: string) {
    const status = getDbStatus();

    if (status.isConnected) {
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

    const txCount = fallbackStore.transactions.filter((t) => t.categoryId === id && t.userId === userId).length;
    if (txCount > 0) {
      throw { statusCode: 400, message: `Cannot delete: ${txCount} transactions use this category.` };
    }

    const idx = fallbackStore.categories.findIndex((c) => c.id === id && c.userId === userId && !c.isDefault);
    if (idx === -1) {
      throw { statusCode: 400, message: 'Cannot delete default category or category not found.' };
    }

    fallbackStore.categories.splice(idx, 1);
    return { success: true };
  }
}

export const categoryService = new CategoryService();
