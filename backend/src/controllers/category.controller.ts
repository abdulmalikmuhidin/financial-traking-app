import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { categoryService } from '../services/category.service';
import { CategoryValidator } from '../validators/category.validator';
import { AuthRequest } from '../types';
import { env } from '../config/env';
import { asyncHandler } from '../common/utils/asyncHandler';
import { BadRequestError } from '../common/errors/AppError';

export class CategoryController {
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const authHeader = req.headers['authorization'];
    let userId: string | undefined;

    // Optional user ID extraction if token provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        userId = decoded.id;
      } catch {}
    }

    const categories = await categoryService.getAll(userId);
    return res.json(categories);
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const validationError = CategoryValidator.validateCreate(req.body);
    if (validationError) {
      throw new BadRequestError(validationError);
    }

    const created = await categoryService.create(userId, req.body);
    return res.status(201).json(created);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await categoryService.delete(userId, id);
    return res.json(result);
  });
}

export const categoryController = new CategoryController();
