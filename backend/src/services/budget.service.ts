import { budgetRepository, BudgetRepository } from '../repositories/budget.repository';
import { assertDbConnected } from '../config/database';

export interface SaveBudgetDto {
  categoryId: string;
  monthlyLimit: number;
  month?: string;
  currency?: string;
}

export class BudgetService {
  constructor(private readonly repo: BudgetRepository = budgetRepository) {}

  async getAll(userId: string) {
    assertDbConnected();

    const docs = await this.repo.findByUserId(userId);
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

    const updated = await this.repo.upsert(
      userId,
      categoryId,
      monthKey,
      parsedLimit,
      currency || 'USD'
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

    await this.repo.deleteByIdAndUser(id, userId);
    return { success: true };
  }
}

export const budgetService = new BudgetService();
