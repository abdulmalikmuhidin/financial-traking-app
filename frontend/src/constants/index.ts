import { NavigationTab } from '../types';

export const NAVIGATION_TABS: NavigationTab[] = [
  'dashboard',
  'transactions',
  'budgets',
  'analytics',
  'categories',
  'settings',
];

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'fintrack_token',
  AUTH_USER: 'fintrack_user',
  LANGUAGE: 'fintrack_language',
  CURRENCY: 'fintrack_currency',
};

export const DEFAULT_FINANCIAL_TARGETS = {
  MONTHLY_INCOME_TARGET: 5000,
  ALERT_THRESHOLD_PERCENT: 80,
};
