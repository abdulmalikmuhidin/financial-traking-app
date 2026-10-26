import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { categoryService } from '../services/category.service';
import { CategoryValidator } from '../validators/category.validator';
import { AuthRequest } from '../types';
import { env } from '../config/env';

export class CategoryController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
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
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to retrieve categories.' });
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const validationError = CategoryValidator.validateCreate(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const created = await categoryService.create(userId, req.body);
      return res.status(201).json(created);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to create category.' });
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await categoryService.delete(userId, id);
      return res.json(result);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to delete category.' });
    }
  }
}

export const categoryController = new CategoryController();
