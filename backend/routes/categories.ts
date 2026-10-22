import { Router, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { TransactionModel } from '../models/Transaction';
import { getDbStatus } from '../db';
import { fallbackStore } from '../fallbackStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Categories can be viewed publicly or authenticated
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    let userId: string | undefined;

    // Optional user ID extraction if token provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.default.verify(
          token,
          process.env.JWT_SECRET || 'fintrack_jwt_default_secret_key_2026'
        ) as any;
        userId = decoded.id;
      } catch {}
    }

    const status = getDbStatus();

    if (status.isConnected) {
      const query = userId 
        ? { $or: [{ isDefault: true }, { userId }] }
        : { isDefault: true };

      const docs = await CategoryModel.find(query);
      return res.json(
        docs.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          icon: d.icon,
          color: d.color,
          isDefault: d.isDefault,
          userId: d.userId,
        }))
      );
    }

    const items = fallbackStore.categories.filter((c) => c.isDefault || c.userId === userId);
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// Protected routes below
router.use(authenticateToken);

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Category name and type are required.' });
    }

    const newId = `cat-${Date.now()}`;
    const status = getDbStatus();

    if (status.isConnected) {
      const doc = new CategoryModel({
        id: newId,
        name: name.trim(),
        type,
        icon: icon || 'Tag',
        color: color || '#3B82F6',
        isDefault: false,
        userId,
      });

      await doc.save();
      return res.status(201).json(doc);
    }

    const newCat = {
      id: newId,
      name: name.trim(),
      type,
      icon: icon || 'Tag',
      color: color || '#3B82F6',
      isDefault: false,
      userId,
    };

    fallbackStore.categories.push(newCat);
    return res.status(201).json(newCat);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const status = getDbStatus();

    // Check if transactions are assigned to this category
    if (status.isConnected) {
      const txCount = await TransactionModel.countDocuments({ categoryId: id, userId });
      if (txCount > 0) {
        return res.status(400).json({ error: `Cannot delete: ${txCount} transactions use this category.` });
      }

      const deleted = await CategoryModel.findOneAndDelete({ id, userId, isDefault: false });
      if (!deleted) {
        return res.status(400).json({ error: 'Cannot delete default category or category not found.' });
      }

      return res.json({ success: true });
    }

    const txCount = fallbackStore.transactions.filter((t) => t.categoryId === id && t.userId === userId).length;
    if (txCount > 0) {
      return res.status(400).json({ error: `Cannot delete: ${txCount} transactions use this category.` });
    }

    const idx = fallbackStore.categories.findIndex((c) => c.id === id && c.userId === userId && !c.isDefault);
    if (idx === -1) {
      return res.status(400).json({ error: 'Cannot delete default category or category not found.' });
    }

    fallbackStore.categories.splice(idx, 1);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;
