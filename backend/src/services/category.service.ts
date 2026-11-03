import { categoryRepository, CategoryRepository } from '../repositories/category.repository';
import { transactionRepository, TransactionRepository } from '../repositories/transaction.repository';
import { assertDbConnected } from '../config/database';
import { BadRequestError } from '../common/errors/AppError';

export interface CreateCategoryDto {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export class CategoryService {
  constructor(
    private readonly repo: CategoryRepository = categoryRepository,
    private readonly txRepo: TransactionRepository = transactionRepository
  ) {}

  async getAll(userId?: string) {
    assertDbConnected();

    const docs = await this.repo.findAll(userId);
    return docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      icon: d.icon,
      color: d.color,
      isDefault: d.isDefault,
      userId: d.userId,
    }));
  }

  async create(userId: string, data: CreateCategoryDto) {
    assertDbConnected();

    const { name, type, icon, color } = data;
    const newId = `cat-${Date.now()}`;

    const doc = await this.repo.create({
      id: newId,
      name: name.trim(),
      type,
      icon: icon || 'Tag',
      color: color || '#3B82F6',
      isDefault: false,
      userId,
    });

    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      icon: doc.icon,
      color: doc.color,
      isDefault: doc.isDefault,
      userId: doc.userId,
    };
  }

  async delete(userId: string, id: string) {
    assertDbConnected();

    const txCount = await this.txRepo.countByCategoryAndUser(id, userId);
    if (txCount > 0) {
      throw new BadRequestError(`Cannot delete: ${txCount} transactions use this category.`);
    }

    const deleted = await this.repo.deleteCustom(id, userId);
    if (!deleted) {
      throw new BadRequestError('Cannot delete default category or category not found.');
    }

    return { success: true };
  }
}

export const categoryService = new CategoryService();
