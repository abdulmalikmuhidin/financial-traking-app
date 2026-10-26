import { TransactionModel } from '../models/Transaction';
import { getDbStatus } from '../config/database';
import { fallbackStore } from './fallbackStore.service';

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
  async getAll(userId: string) {
    const status = getDbStatus();

    if (status.isConnected) {
      const docs = await TransactionModel.find({ userId }).sort({ date: -1 });
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

    return fallbackStore.transactions.filter((t) => t.userId === userId);
  }

  async create(userId: string, data: CreateTransactionDto) {
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

    const status = getDbStatus();

    if (status.isConnected) {
      const newTx = new TransactionModel({
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

      await newTx.save();

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

    const createdItem = {
      id: `tx-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
    };

    fallbackStore.transactions.unshift(createdItem);
    return createdItem;
  }

  async update(userId: string, id: string, updates: any) {
    const status = getDbStatus();

    if (status.isConnected) {
      const updated = await TransactionModel.findOneAndUpdate(
        { _id: id, userId },
        { ...updates },
        { new: true }
      );

      if (!updated) {
        throw { statusCode: 404, message: 'Transaction not found or unauthorized.' };
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

    const idx = fallbackStore.transactions.findIndex((t) => t.id === id && t.userId === userId);
    if (idx === -1) {
      throw { statusCode: 404, message: 'Transaction not found.' };
    }

    fallbackStore.transactions[idx] = {
      ...fallbackStore.transactions[idx],
      ...updates,
    };

    return fallbackStore.transactions[idx];
  }

  async delete(userId: string, id: string) {
    const status = getDbStatus();

    if (status.isConnected) {
      const deleted = await TransactionModel.findOneAndDelete({ _id: id, userId });
      if (!deleted) {
        throw { statusCode: 404, message: 'Transaction not found or unauthorized.' };
      }
      return { success: true, message: 'Transaction deleted.' };
    }

    const idx = fallbackStore.transactions.findIndex((t) => t.id === id && t.userId === userId);
    if (idx === -1) {
      throw { statusCode: 404, message: 'Transaction not found.' };
    }

    fallbackStore.transactions.splice(idx, 1);
    return { success: true, message: 'Transaction deleted.' };
  }
}

export const transactionService = new TransactionService();
