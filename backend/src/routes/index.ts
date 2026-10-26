import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import budgetRoutes from './budget.routes';
import categoryRoutes from './category.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/budgets', budgetRoutes);
apiRouter.use('/categories', categoryRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default apiRouter;
