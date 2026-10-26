import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', budgetController.getAll.bind(budgetController));
router.post('/', budgetController.upsert.bind(budgetController));
router.delete('/:id', budgetController.delete.bind(budgetController));

export default router;
