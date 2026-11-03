import { Response } from 'express';
import { budgetService } from '../services/budget.service';
import { BudgetValidator } from '../validators/budget.validator';
import { AuthRequest } from '../types';
import { asyncHandler } from '../common/utils/asyncHandler';
import { BadRequestError } from '../common/errors/AppError';

export class BudgetController {
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const budgets = await budgetService.getAll(userId);
    return res.json(budgets);
  });

  upsert = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const validationError = BudgetValidator.validateUpsert(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const budget = await budgetService.upsert(userId, req.body);
    return res.status(200).json(budget);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await budgetService.delete(userId, id);
    return res.json(result);
  });
}

export const budgetController = new BudgetController();
