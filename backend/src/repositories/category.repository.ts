import { CategoryModel, ICategory } from '../models/Category';

export class CategoryRepository {
  async findAll(userId?: string): Promise<ICategory[]> {
    const query = userId 
      ? { $or: [{ isDefault: true }, { userId }] }
      : { isDefault: true };

    return CategoryModel.find(query);
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    const doc = new CategoryModel(data);
    return doc.save();
  }

  async deleteCustom(id: string, userId: string): Promise<ICategory | null> {
    return CategoryModel.findOneAndDelete({ id, userId, isDefault: false });
  }
}

export const categoryRepository = new CategoryRepository();

