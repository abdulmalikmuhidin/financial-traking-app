export class TransactionValidator {
  static validateCreate(body: any): string | null {
    const { amount, description, categoryId, date } = body;
    if (!amount || parseFloat(amount) <= 0 || !description || !categoryId || !date) {
      return 'Missing required transaction fields.';
    }
    return null;
  }
}
