import { BudgetModel, IBudget } from '../models/Budget';

export class BudgetRepository {
  async findByUserId(userId: string): Promise<IBudget[]> {
    return BudgetModel.find({ userId });
  }

  async upsert(
    userId: string,
    categoryId: string,
    month: string,
    monthlyLimit: number,
    currency = 'USD'
  ): Promise<IBudget> {
    return BudgetModel.findOneAndUpdate(
      { userId, categoryId, month },
      { monthlyLimit, currency },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<IBudget | null> {
    return BudgetModel.findOneAndDelete({ _id: id, userId });
  }
}

export const budgetRepository = new BudgetRepository();

