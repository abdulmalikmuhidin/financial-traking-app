import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Transaction, 
  Budget, 
  Category, 
  Toast, 
  ToastType 
} from '../types';
import { useAuth } from './AuthContext';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_DEMO_TRANSACTIONS, 
  INITIAL_DEMO_BUDGETS 
} from '../utils/mockData';
import { convertCurrency, formatCurrency } from '../utils/currencies';

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
  formatAmount: (amount: number, fromCode?: string) => string;

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
  resetToDemoData: () => void;
  clearAllUserData: () => void;
  exportTransactionsToCSV: () => void;
  importTransactionsFromCSV: (csvText: string) => { added: number; errors: number };
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
    return currentUser?.preferredCurrency || 'USD';
  });

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
    return currentUser?.isDemoUser ? INITIAL_DEMO_TRANSACTIONS : [];
  });

  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return currentUser?.isDemoUser ? INITIAL_DEMO_BUDGETS : [];
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
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch transactions
        const txRes = await fetch('/api/transactions', { headers });
        if (txRes.ok) {
          const txData = await txRes.json();
          if (Array.isArray(txData) && txData.length > 0) {
            setTransactions(txData);
          }
        }

        // Fetch budgets
        const bRes = await fetch('/api/budgets', { headers });
        if (bRes.ok) {
          const bData = await bRes.json();
          if (Array.isArray(bData) && bData.length > 0) {
            setBudgets(bData);
          }
        }

        // Fetch categories
        const catRes = await fetch('/api/categories', { headers });
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            setCategories(catData);
          }
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
    showToast(`Currency changed to ${code}`, 'info');
  };

  const convertAmount = (amount: number, fromCode: string = 'USD'): number => {
    return convertCurrency(amount, fromCode, currency);
  };

  const formatAmount = (amount: number, fromCode: string = currency): string => {
    const converted = fromCode === currency ? amount : convertCurrency(amount, fromCode, currency);
    return formatCurrency(converted, currency);
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
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(txData),
        });
        if (res.ok) {
          const saved = await res.json();
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
        await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
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
        await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
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
        await fetch('/api/budgets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ categoryId, monthlyLimit, month, currency }),
        });
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
        await fetch(`/api/budgets/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
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
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(catData),
        });
        if (res.ok) {
          const saved = await res.json();
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
      fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch((e) => console.warn('Category delete failed', e));
    }
    return true;
  };

  // Data actions
  const resetToDemoData = () => {
    setTransactions(INITIAL_DEMO_TRANSACTIONS);
    setBudgets(INITIAL_DEMO_BUDGETS);
    setCategories(DEFAULT_CATEGORIES);
    setCurrencyState('USD');
    showToast('Reset to realistic demo dataset', 'info');
  };

  const clearAllUserData = () => {
    setTransactions([]);
    setBudgets([]);
    showToast('All transaction and budget data cleared', 'warning');
  };

  // CSV Export & Import
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

  const importTransactionsFromCSV = (csvText: string): { added: number; errors: number } => {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      showToast('CSV is empty or missing data rows', 'error');
      return { added: 0, errors: 0 };
    }

    let added = 0;
    let errors = 0;
    const newItems: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const raw = lines[i];
        const match = raw.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!match || match.length < 5) {
          errors++;
          continue;
        }

        const clean = (val: string) => (val || '').replace(/^"|"$/g, '').trim();

        const date = clean(match[0]);
        const type = clean(match[1]).toLowerCase() === 'income' ? 'income' : 'expense';
        const description = clean(match[2]) || 'Imported Transaction';
        const merchant = clean(match[3]) || undefined;
        const categoryName = clean(match[4]);
        const amount = parseFloat(clean(match[5])) || 0;
        const txCurrency = clean(match[6]) || currency;
        const paymentMethod = (clean(match[7]) as any) || 'Credit Card';
        const notes = clean(match[8]) || undefined;

        if (amount <= 0 || !date) {
          errors++;
          continue;
        }

        let catObj = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
        let catId = catObj ? catObj.id : (type === 'income' ? 'cat-salary' : 'cat-shopping');

        newItems.push({
          id: `tx-imp-${Date.now()}-${i}`,
          userId,
          type,
          amount,
          currency: txCurrency,
          categoryId: catId,
          date,
          description,
          merchant,
          paymentMethod,
          notes,
          createdAt: new Date().toISOString(),
        });
        added++;
      } catch {
        errors++;
      }
    }

    if (newItems.length > 0) {
      setTransactions((prev) => [...newItems, ...prev]);
      showToast(`Successfully imported ${added} transactions`, 'success');
    } else {
      showToast('No valid transactions could be parsed from file', 'error');
    }

    return { added, errors };
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
        formatAmount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setCategoryBudget,
        deleteBudget,
        addCategory,
        updateCategory,
        deleteCategory,
        resetToDemoData,
        clearAllUserData,
        exportTransactionsToCSV,
        importTransactionsFromCSV,
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
