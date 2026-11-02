import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Transaction, 
  Budget, 
  Category, 
  Toast, 
  ToastType 
} from '../types';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { convertCurrency, formatCurrency } from '../utils/currencies';
import { financeApiService } from '../services/finance.service';
import { STORAGE_KEYS } from '../constants';

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface FinanceContextType {
  // Data
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  currency: string;
  setCurrency: (code: string) => void;

  // Calculators & Converters
  convertAmount: (amount: number, fromCode: string) => number;

  // Transaction CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget CRUD
  setCategoryBudget: (categoryId: string, monthlyLimit: number, month?: string) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Category CRUD
  addCategory: (category: Omit<Category, 'id' | 'isDefault'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => boolean;

  // Data Actions
  clearAllUserData: () => void;
  exportTransactionsToCSV: () => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonString: string) => boolean;

  // UI State: Toasts & Confirmations
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  confirmation: ConfirmationConfig | null;
  requestConfirmation: (config: ConfirmationConfig) => void;
  closeConfirmation: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, token } = useAuth();
  const { language } = useLanguage();
  const userId = currentUser ? currentUser.id : 'guest';

  // Storage keys scoped to the user
  const STORAGE_KEY_TX = `fintrack_tx_${userId}`;
  const STORAGE_KEY_BUDGETS = `fintrack_budgets_${userId}`;
  const STORAGE_KEY_CATEGORIES = `fintrack_categories_${userId}`;
  const STORAGE_KEY_CURRENCY = `fintrack_currency_${userId}`;

  // Currency preference
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      if (saved) return saved;
    } catch {}
    const savedLang = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LANGUAGE) : null;
    if (savedLang === 'am') return 'ETB';
    return currentUser?.preferredCurrency || (language === 'am' ? 'ETB' : 'USD');
  });

  // Synchronize currency with application language changes
  useEffect(() => {
    if (language === 'am' && currency === 'USD') {
      setCurrencyState('ETB');
      try {
        localStorage.setItem(STORAGE_KEY_CURRENCY, 'ETB');
      } catch {}
    } else if (language === 'en' && currency === 'ETB') {
      setCurrencyState('USD');
      try {
        localStorage.setItem(STORAGE_KEY_CURRENCY, 'USD');
      } catch {}
    }
  }, [language]);

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // UI state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationConfig | null>(null);

  // Sync to localStorage
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
    } catch (e) {
      console.error('Failed to sync finance data to localStorage', e);
    }
  }, [transactions, budgets, categories, currency, currentUser, userId]);

  // Load from backend API when authenticated
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setBudgets([]);
      return;
    }

    const loadBackendData = async () => {
      if (!token) return;

      try {
        const [backendTx, backendBudgets, backendCategories] = await Promise.allSettled([
          financeApiService.getTransactions(),
          financeApiService.getBudgets(),
          financeApiService.getCategories(),
        ]);

        if (backendTx.status === 'fulfilled' && Array.isArray(backendTx.value) && backendTx.value.length > 0) {
          setTransactions(backendTx.value);
        }
        if (backendBudgets.status === 'fulfilled' && Array.isArray(backendBudgets.value) && backendBudgets.value.length > 0) {
          setBudgets(backendBudgets.value);
        }
        if (backendCategories.status === 'fulfilled' && Array.isArray(backendCategories.value) && backendCategories.value.length > 0) {
          setCategories(backendCategories.value);
        }
      } catch (err) {
        console.warn('Backend data sync deferred to local cache', err);
      }
    };

    loadBackendData();
  }, [currentUser?.id, token]);

  // Toast Helpers
  const showToast = (message: string, type: ToastType = 'info', duration: number = 3800) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Confirmation modal helpers
  const requestConfirmation = (config: ConfirmationConfig) => {
    setConfirmation(config);
  };

  const closeConfirmation = () => {
    setConfirmation(null);
  };

  // Currency Helpers
  const setCurrency = (code: string) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, code);
    } catch {}
    showToast(
      language === 'am' ? `የገንዘብ አይነት ወደ ${code} ተቀይሯል` : `Currency changed to ${code}`,
      'info'
    );
  };

  const convertAmount = (amount: number, fromCode: string = 'USD'): number => {
    return convertCurrency(amount, fromCode, currency);
  };

  // Transaction CRUD
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    const tempId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      ...txData,
      id: tempId,
      userId,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      `${txData.type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(txData.amount, txData.currency)} recorded`,
      'success'
    );

    // Sync to backend if token present
    if (token) {
      try {
        const saved = await financeApiService.createTransaction(txData);
        if (saved && saved.id) {
          setTransactions((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
        }
      } catch (e) {
        console.warn('Backend sync failed, stored in client cache', e);
      }
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
    showToast('Transaction updated', 'success');

    if (token) {
      try {
        await financeApiService.updateTransaction(id, updates);
      } catch (e) {
        console.warn('Backend update failed', e);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    showToast('Transaction deleted', 'info');

    if (token) {
      try {
        await financeApiService.deleteTransaction(id);
      } catch (e) {
        console.warn('Backend delete failed', e);
      }
    }
  };

  // Budget CRUD
  const setCategoryBudget = async (
    categoryId: string, 
    monthlyLimit: number, 
    month: string = '2026-10'
  ) => {
    setBudgets((prev) => {
      const existingIdx = prev.findIndex(
        (b) => b.categoryId === categoryId && b.month === month
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          monthlyLimit,
          currency,
        };
        return updated;
      } else {
        const newBudget: Budget = {
          id: `b-${Date.now()}`,
          userId,
          categoryId,
          monthlyLimit,
          month,
          currency,
        };
        return [...prev, newBudget];
      }
    });
    showToast('Monthly budget updated', 'success');

    if (token) {
      try {
        await financeApiService.saveBudget({ categoryId, monthlyLimit, month, currency });
      } catch (e) {
        console.warn('Budget backend sync failed', e);
      }
    }
  };

  const deleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    showToast('Budget allocation removed', 'info');

    if (token) {
      try {
        await financeApiService.deleteBudget(id);
      } catch (e) {
        console.warn('Budget backend delete failed', e);
      }
    }
  };

  // Category CRUD
  const addCategory = async (catData: Omit<Category, 'id' | 'isDefault'>) => {
    const tempId = `cat-${Date.now()}`;
    const newCat: Category = {
      ...catData,
      id: tempId,
      isDefault: false,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Category "${catData.name}" created`, 'success');

    if (token) {
      try {
        const saved = await financeApiService.createCategory(catData);
        if (saved && saved.id) {
          setCategories((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
        }
      } catch (e) {
        console.warn('Category backend sync failed', e);
      }
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Category updated', 'success');
  };

  const deleteCategory = (id: string): boolean => {
    const count = transactions.filter((t) => t.categoryId === id).length;
    if (count > 0) {
      showToast(`Cannot delete category: ${count} transactions are assigned to it.`, 'error');
      return false;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
    showToast('Category deleted', 'info');

    if (token) {
      financeApiService.deleteCategory(id).catch((e) => console.warn('Category delete failed', e));
    }
    return true;
  };

  // Data actions
  const clearAllUserData = () => {
    setTransactions([]);
    setBudgets([]);
    showToast('All transaction and budget data cleared', 'warning');
  };

  // CSV Export
  const exportTransactionsToCSV = () => {
    if (transactions.length === 0) {
      showToast('No transactions to export', 'warning');
      return;
    }

    const headers = ['Date', 'Type', 'Description', 'Merchant', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes'];
    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name || 'Uncategorized';
      return [
        `"${t.date}"`,
        `"${t.type}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.merchant || '').replace(/"/g, '""')}"`,
        `"${cat}"`,
        t.amount.toFixed(2),
        `"${t.currency}"`,
        `"${t.paymentMethod}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fintrack_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported to CSV', 'success');
  };

  const exportBackupJSON = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: currentUser,
      currency,
      categories,
      budgets,
      transactions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    showToast('Full backup exported', 'success');
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        showToast('Invalid backup file structure', 'error');
        return false;
      }

      if (parsed.categories && Array.isArray(parsed.categories)) {
        setCategories(parsed.categories);
      }
      if (parsed.budgets && Array.isArray(parsed.budgets)) {
        setBudgets(parsed.budgets);
      }
      setTransactions(parsed.transactions);
      if (parsed.currency) {
        setCurrencyState(parsed.currency);
      }

      showToast('Backup restored successfully!', 'success');
      return true;
    } catch {
      showToast('Failed to parse backup JSON file', 'error');
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        categories,
        currency,
        setCurrency,
        convertAmount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setCategoryBudget,
        deleteBudget,
        addCategory,
        updateCategory,
        deleteCategory,
        clearAllUserData,
        exportTransactionsToCSV,
        exportBackupJSON,
        importBackupJSON,
        toasts,
        showToast,
        dismissToast,
        confirmation,
        requestConfirmation,
        closeConfirmation,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
