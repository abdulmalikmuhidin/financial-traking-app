import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Categories listing can be viewed with optional auth
router.get('/', categoryController.getAll.bind(categoryController));

// Mutating categories requires authentication
router.post('/', authenticateToken, categoryController.create.bind(categoryController));
router.delete('/:id', authenticateToken, categoryController.delete.bind(categoryController));

export default router;
