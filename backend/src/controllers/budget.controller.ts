import { Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service';
import { BudgetValidator } from '../validators/budget.validator';
import { AuthRequest } from '../types';

export class BudgetController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const budgets = await budgetService.getAll(userId);
      return res.json(budgets);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to retrieve budgets.' });
    }
  }

  async upsert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validationError = BudgetValidator.validateUpsert(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const budget = await budgetService.upsert(userId, req.body);
      return res.status(200).json(budget);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to save budget.' });
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await budgetService.delete(userId, id);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to delete budget.' });
    }
  }
}

export const budgetController = new BudgetController();
