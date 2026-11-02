export interface SystemDefaultCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
}

export const SYSTEM_DEFAULT_CATEGORIES: SystemDefaultCategory[] = [
  { id: 'cat-housing', name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#3B82F6', isDefault: true },
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#10B981', isDefault: true },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#F59E0B', isDefault: true },
  { id: 'cat-utilities', name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#6366F1', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping & Retail', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', isDefault: true },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'Tv', color: '#8B5CF6', isDefault: true },
  { id: 'cat-healthcare', name: 'Healthcare & Wellness', type: 'expense', icon: 'HeartPulse', color: '#14B8A6', isDefault: true },
  { id: 'cat-education', name: 'Education & Courses', type: 'expense', icon: 'GraduationCap', color: '#0EA5E9', isDefault: true },
  { id: 'cat-travel', name: 'Travel & Trips', type: 'expense', icon: 'Plane', color: '#F97316', isDefault: true },
  { id: 'cat-investments', name: 'Investments & Savings', type: 'expense', icon: 'TrendingUp', color: '#059669', isDefault: true },
  { id: 'cat-salary', name: 'Salary & Wages', type: 'income', icon: 'Briefcase', color: '#10B981', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance & Consulting', type: 'income', icon: 'Laptop', color: '#3B82F6', isDefault: true },
  { id: 'cat-dividends', name: 'Dividends & Interest', type: 'income', icon: 'PiggyBank', color: '#8B5CF6', isDefault: true },
  { id: 'cat-gifts', name: 'Gifts & Refunds', type: 'income', icon: 'Gift', color: '#F59E0B', isDefault: true },
];

