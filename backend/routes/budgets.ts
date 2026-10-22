import { Router, Response } from 'express';
import { BudgetModel } from '../models/Budget';
import { getDbStatus } from '../db';
import { fallbackStore } from '../fallbackStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/budgets
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = getDbStatus();

    if (status.isConnected) {
      const docs = await BudgetModel.find({ userId });
      return res.json(
        docs.map((d) => ({
          id: d._id.toString(),
          userId: d.userId,
          categoryId: d.categoryId,
          monthlyLimit: d.monthlyLimit,
          month: d.month,
          currency: d.currency,
        }))
      );
    }

    const items = fallbackStore.budgets.filter((b) => b.userId === userId);
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve budgets.' });
  }
});

// POST /api/budgets
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryId, monthlyLimit, month, currency } = req.body;

    if (!categoryId || !monthlyLimit || monthlyLimit <= 0) {
      return res.status(400).json({ error: 'Valid category and limit are required.' });
    }

    const monthKey = month || '2026-10';
    const status = getDbStatus();

    if (status.isConnected) {
      const updated = await BudgetModel.findOneAndUpdate(
        { userId, categoryId, month: monthKey },
        { monthlyLimit: parseFloat(monthlyLimit), currency: currency || 'USD' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json({
        id: updated._id.toString(),
        userId: updated.userId,
        categoryId: updated.categoryId,
        monthlyLimit: updated.monthlyLimit,
        month: updated.month,
        currency: updated.currency,
      });
    }

    const existingIdx = fallbackStore.budgets.findIndex(
      (b) => b.userId === userId && b.categoryId === categoryId && b.month === monthKey
    );

    if (existingIdx !== -1) {
      fallbackStore.budgets[existingIdx].monthlyLimit = parseFloat(monthlyLimit);
      if (currency) fallbackStore.budgets[existingIdx].currency = currency;
      return res.json(fallbackStore.budgets[existingIdx]);
    }

    const newBudget = {
      id: `b-${Date.now()}`,
      userId,
      categoryId,
      monthlyLimit: parseFloat(monthlyLimit),
      month: monthKey,
      currency: currency || 'USD',
    };

    fallbackStore.budgets.push(newBudget);
    return res.status(201).json(newBudget);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save budget.' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const status = getDbStatus();

    if (status.isConnected) {
      await BudgetModel.findOneAndDelete({ _id: id, userId });
      return res.json({ success: true });
    }

    const idx = fallbackStore.budgets.findIndex((b) => b.id === id && b.userId === userId);
    if (idx !== -1) {
      fallbackStore.budgets.splice(idx, 1);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete budget.' });
  }
});

export default router;
