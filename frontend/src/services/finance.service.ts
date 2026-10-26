import { request } from './api';
import { Transaction, Budget, Category } from '../types';

export const financeApiService = {
  // Transactions
  getTransactions(): Promise<Transaction[]> {
    return request<Transaction[]>('/api/transactions');
  },

  createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    return request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return request<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteTransaction(id: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Budgets
  getBudgets(): Promise<Budget[]> {
    return request<Budget[]>('/api/budgets');
  },

  saveBudget(budgetData: {
    categoryId: string;
    monthlyLimit: number;
    month?: string;
    currency?: string;
  }): Promise<Budget> {
    return request<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  },

  deleteBudget(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  getCategories(): Promise<Category[]> {
    return request<Category[]>('/api/categories');
  },

  createCategory(categoryData: {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
  }): Promise<Category> {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
