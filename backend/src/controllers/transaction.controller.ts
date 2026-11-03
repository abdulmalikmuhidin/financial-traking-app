import { Response } from 'express';
import { transactionService } from '../services/transaction.service';
import { TransactionValidator } from '../validators/transaction.validator';
import { AuthRequest } from '../types';
import { asyncHandler } from '../common/utils/asyncHandler';
import { BadRequestError } from '../common/errors/AppError';

export class TransactionController {
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const transactions = await transactionService.getAll(userId);
    return res.json(transactions);
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const validationError = TransactionValidator.validateCreate(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const created = await transactionService.create(userId, req.body);
    return res.status(201).json(created);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const updated = await transactionService.update(userId, id, req.body);
    return res.json(updated);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await transactionService.delete(userId, id);
    return res.json(result);
  });
}

export const transactionController = new TransactionController();
