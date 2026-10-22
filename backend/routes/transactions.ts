import { Router, Response } from 'express';
import { TransactionModel } from '../models/Transaction';
import { getDbStatus } from '../db';
import { fallbackStore } from '../fallbackStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth to all transaction endpoints
router.use(authenticateToken);

// GET /api/transactions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = getDbStatus();

    if (status.isConnected) {
      const docs = await TransactionModel.find({ userId }).sort({ date: -1 });
      return res.json(
        docs.map((d) => ({
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
        }))
      );
    }

    const items = fallbackStore.transactions.filter((t) => t.userId === userId);
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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
    } = req.body;

    if (!amount || amount <= 0 || !description || !categoryId || !date) {
      return res.status(400).json({ error: 'Missing required transaction fields.' });
    }

    const status = getDbStatus();

    if (status.isConnected) {
      const newTx = new TransactionModel({
        userId,
        type,
        amount: parseFloat(amount),
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

      return res.status(201).json({
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
      });
    }

    const createdItem = {
      id: `tx-${Date.now()}`,
      userId,
      type,
      amount: parseFloat(amount),
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
    return res.status(201).json(createdItem);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updates = req.body;
    const status = getDbStatus();

    if (status.isConnected) {
      const updated = await TransactionModel.findOneAndUpdate(
        { _id: id, userId },
        { ...updates },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
      }

      return res.json({
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
      });
    }

    const idx = fallbackStore.transactions.findIndex((t) => t.id === id && t.userId === userId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    fallbackStore.transactions[idx] = {
      ...fallbackStore.transactions[idx],
      ...updates,
    };

    return res.json(fallbackStore.transactions[idx]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const status = getDbStatus();

    if (status.isConnected) {
      const deleted = await TransactionModel.findOneAndDelete({ _id: id, userId });
      if (!deleted) {
        return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
      }
      return res.json({ success: true, message: 'Transaction deleted.' });
    }

    const idx = fallbackStore.transactions.findIndex((t) => t.id === id && t.userId === userId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    fallbackStore.transactions.splice(idx, 1);
    return res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

export default router;
