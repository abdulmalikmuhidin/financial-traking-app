import { transactionRepository, TransactionRepository } from '../repositories/transaction.repository';
import { assertDbConnected } from '../config/database';
import { NotFoundError } from '../common/errors/AppError';

export interface CreateTransactionDto {
  type: 'income' | 'expense';
  amount: number;
  currency?: string;
  categoryId: string;
  date: string;
  description: string;
  merchant?: string;
  paymentMethod?: string;
  notes?: string;
  isRecurring?: boolean;
}

export class TransactionService {
  constructor(private readonly repo: TransactionRepository = transactionRepository) {}

  async getAll(userId: string) {
    assertDbConnected();

    const docs = await this.repo.findByUserId(userId);
    return docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      type: d.type,
      amount: d.amount,
      currency: d.currency,
      categoryId: d.categoryId,
      date: d.date,
      description: d.description,
      merchant: d.merchant,
      paymentMethod: d.paymentMethod,
      notes: d.notes,
      isRecurring: d.isRecurring,
      createdAt: d.createdAt,
    }));
  }

  async create(userId: string, data: CreateTransactionDto) {
    assertDbConnected();

    const {
      type,
      amount,
      currency,
      categoryId,
      date,
      description,
      merchant,
      paymentMethod,
      notes,
      isRecurring,
    } = data;

    const newTx = await this.repo.create({
      userId,
      type,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency: currency || 'USD',
      categoryId,
      date,
      description: description.trim(),
      merchant: merchant ? merchant.trim() : undefined,
      paymentMethod: paymentMethod || 'Credit Card',
      notes: notes ? notes.trim() : undefined,
      isRecurring: !!isRecurring,
    });

    return {
      id: newTx._id.toString(),
      userId: newTx.userId,
      type: newTx.type,
      amount: newTx.amount,
      currency: newTx.currency,
      categoryId: newTx.categoryId,
      date: newTx.date,
      description: newTx.description,
      merchant: newTx.merchant,
      paymentMethod: newTx.paymentMethod,
      notes: newTx.notes,
      isRecurring: newTx.isRecurring,
      createdAt: newTx.createdAt,
    };
  }

  async update(userId: string, id: string, updates: any) {
    assertDbConnected();

    const updated = await this.repo.updateByIdAndUser(id, userId, updates);

    if (!updated) {
      throw new NotFoundError('Transaction not found or unauthorized.');
    }

    return {
      id: updated._id.toString(),
      userId: updated.userId,
      type: updated.type,
      amount: updated.amount,
      currency: updated.currency,
      categoryId: updated.categoryId,
      date: updated.date,
      description: updated.description,
      merchant: updated.merchant,
      paymentMethod: updated.paymentMethod,
      notes: updated.notes,
      isRecurring: updated.isRecurring,
      createdAt: updated.createdAt,
    };
  }

  async delete(userId: string, id: string) {
    assertDbConnected();

    const deleted = await this.repo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundError('Transaction not found or unauthorized.');
    }
    return { success: true, message: 'Transaction deleted.' };
  }
}

export const transactionService = new TransactionService();
