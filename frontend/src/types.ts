/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NavigationTab = 
  | 'dashboard' 
  | 'transactions' 
  | 'budgets' 
  | 'analytics' 
  | 'categories' 
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  preferredCurrency: string;
  isDemoUser: boolean;
  isEmailVerified?: boolean;
  monthlyIncomeTarget?: number;
  alertThresholdPercent?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  categoryId: string;
  date: string;
  description: string;
  merchant?: string;
  paymentMethod: string;
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  month: string;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
