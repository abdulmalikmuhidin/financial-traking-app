import { BudgetModel } from '../models/Budget';
import { assertDbConnected } from '../config/database';

export interface SaveBudgetDto {
  categoryId: string;
  monthlyLimit: number;
  month?: string;
  currency?: string;
}

export class BudgetService {
  async getAll(userId: string) {
    assertDbConnected();

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

  async upsert(userId: string, data: SaveBudgetDto) {
    assertDbConnected();

    const { categoryId, monthlyLimit, month, currency } = data;
    const monthKey = month || '2026-10';
    const parsedLimit = typeof monthlyLimit === 'string' ? parseFloat(monthlyLimit) : monthlyLimit;

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

  async delete(userId: string, id: string) {
    assertDbConnected();

    await BudgetModel.findOneAndDelete({ _id: id, userId });
    return { success: true };
  }
}

export const budgetService = new BudgetService();
