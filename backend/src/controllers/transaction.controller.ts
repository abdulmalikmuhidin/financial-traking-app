import { Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { TransactionValidator } from '../validators/transaction.validator';
import { AuthRequest } from '../types';

export class TransactionController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const transactions = await transactionService.getAll(userId);
      return res.json(transactions);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to retrieve transactions.' });
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validationError = TransactionValidator.validateCreate(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const created = await transactionService.create(userId, req.body);
      return res.status(201).json(created);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to create transaction.' });
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await transactionService.update(userId, id, req.body);
      return res.json(updated);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to update transaction.' });
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await transactionService.delete(userId, id);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to delete transaction.' });
    }
  }
}

export const transactionController = new TransactionController();
