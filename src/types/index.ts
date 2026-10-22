export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'Credit Card' 
  | 'Debit Card' 
  | 'Bank Transfer' 
  | 'Cash' 
  | 'Direct Deposit' 
  | 'Electronic Transfer';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number; // 1 USD = rateToUSD in foreign currency
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
  currency: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  preferredCurrency: string;
  isDemoUser: boolean;
  monthlyIncomeTarget?: number;
  alertThresholdPercent?: number; // e.g. 80%
  createdAt: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export type NavigationTab = 
  | 'dashboard' 
  | 'transactions' 
  | 'budgets' 
  | 'analytics' 
  | 'categories' 
  | 'settings';
