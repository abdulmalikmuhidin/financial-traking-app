export class CategoryValidator {
  static validateCreate(body: any): string | null {
    const { name, type } = body;
    if (!name || !type) {
      return 'Category name and type are required.';
    }
    return null;
  }
}
