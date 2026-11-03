import { TransactionModel, ITransaction } from '../models/Transaction';

export class TransactionRepository {
  async findByUserId(userId: string): Promise<ITransaction[]> {
    return TransactionModel.find({ userId }).sort({ date: -1 });
  }

  async findByIdAndUser(id: string, userId: string): Promise<ITransaction | null> {
    return TransactionModel.findOne({ _id: id, userId });
  }

  async create(data: Partial<ITransaction>): Promise<ITransaction> {
    const doc = new TransactionModel(data);
    return doc.save();
  }

  async updateByIdAndUser(
    id: string,
    userId: string,
    updates: Partial<ITransaction>
  ): Promise<ITransaction | null> {
    return TransactionModel.findOneAndUpdate(
      { _id: id, userId },
      { ...updates },
      { new: true }
    );
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<ITransaction | null> {
    return TransactionModel.findOneAndDelete({ _id: id, userId });
  }

  async countByCategoryAndUser(categoryId: string, userId: string): Promise<number> {
    return TransactionModel.countDocuments({ categoryId, userId });
  }
}

export const transactionRepository = new TransactionRepository();

