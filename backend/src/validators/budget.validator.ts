export class BudgetValidator {
  static validateUpsert(body: any): string | null {
    const { categoryId, monthlyLimit } = body;
    if (!categoryId || !monthlyLimit || parseFloat(monthlyLimit) <= 0) {
      return 'Valid category and limit are required.';
    }
    return null;
  }
}
