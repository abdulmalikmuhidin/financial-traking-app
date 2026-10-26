import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth to all transaction endpoints
router.use(authenticateToken);

router.get('/', transactionController.getAll.bind(transactionController));
router.post('/', transactionController.create.bind(transactionController));
router.put('/:id', transactionController.update.bind(transactionController));
router.delete('/:id', transactionController.delete.bind(transactionController));

export default router;
