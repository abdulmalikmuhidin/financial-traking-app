import { BudgetModel } from '../models/Budget';
import { getDbStatus } from '../config/database';
import { fallbackStore } from './fallbackStore.service';

export interface SaveBudgetDto {
  categoryId: string;
  monthlyLimit: number;
  month?: string;
  currency?: string;
}

export class BudgetService {
  async getAll(userId: string) {
    const status = getDbStatus();

    if (status.isConnected) {
      const docs = await BudgetModel.find({ userId });
      return docs.map((d) => ({
        id: d._id.toString(),
        userId: d.userId,
        categoryId: d.categoryId,
        monthlyLimit: d.monthlyLimit,
        month: d.month,
        currency: d.currency,
      }));
    }

    return fallbackStore.budgets.filter((b) => b.userId === userId);
  }

  async upsert(userId: string, data: SaveBudgetDto) {
    const { categoryId, monthlyLimit, month, currency } = data;
    const monthKey = month || '2026-10';
    const parsedLimit = typeof monthlyLimit === 'string' ? parseFloat(monthlyLimit) : monthlyLimit;
    const status = getDbStatus();

    if (status.isConnected) {
      const updated = await BudgetModel.findOneAndUpdate(
        { userId, categoryId, month: monthKey },
        { monthlyLimit: parsedLimit, currency: currency || 'USD' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return {
        id: updated._id.toString(),
        userId: updated.userId,
        categoryId: updated.categoryId,
        monthlyLimit: updated.monthlyLimit,
        month: updated.month,
        currency: updated.currency,
      };
    }

    const existingIdx = fallbackStore.budgets.findIndex(
      (b) => b.userId === userId && b.categoryId === categoryId && b.month === monthKey
    );

    if (existingIdx !== -1) {
      fallbackStore.budgets[existingIdx].monthlyLimit = parsedLimit;
      if (currency) fallbackStore.budgets[existingIdx].currency = currency;
      return fallbackStore.budgets[existingIdx];
    }

    const newBudget = {
      id: `b-${Date.now()}`,
      userId,
      categoryId,
      monthlyLimit: parsedLimit,
      month: monthKey,
      currency: currency || 'USD',
    };

    fallbackStore.budgets.push(newBudget);
    return newBudget;
  }

  async delete(userId: string, id: string) {
    const status = getDbStatus();

    if (status.isConnected) {
      await BudgetModel.findOneAndDelete({ _id: id, userId });
      return { success: true };
    }

    const idx = fallbackStore.budgets.findIndex((b) => b.id === id && b.userId === userId);
    if (idx !== -1) {
      fallbackStore.budgets.splice(idx, 1);
    }
    return { success: true };
  }
}

export const budgetService = new BudgetService();
