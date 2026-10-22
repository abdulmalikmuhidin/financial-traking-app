import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Budget } from '../../types';
import { useFinance } from '../../context/FinanceContext';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
}) => {
  const { categories, currency, budgets, setCategoryBudget } = useFinance();

  const [categoryId, setCategoryId] = useState<string>('');
  const [limit, setLimit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Filter only expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Categories that don't already have a budget (except the one being edited)
  const availableCategories = expenseCategories.filter((c) => {
    if (budgetToEdit && budgetToEdit.categoryId === c.id) return true;
    return !budgets.some((b) => b.categoryId === c.id);
  });

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId);
      setLimit(budgetToEdit.monthlyLimit.toString());
      setError(null);
    } else {
      setCategoryId(availableCategories[0]?.id || expenseCategories[0]?.id || '');
      setLimit('');
      setError(null);
    }
  }, [budgetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Please specify a monthly budget limit greater than zero.');
      return;
    }

    if (!categoryId) {
      setError('Please choose a category for this budget.');
      return;
    }

    setCategoryBudget(categoryId, parsedLimit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {budgetToEdit ? 'Adjust Monthly Budget' : 'Set Category Budget'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expense Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!!budgetToEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white disabled:bg-slate-50 disabled:text-slate-500"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {availableCategories.length === 0 && !budgetToEdit && (
                <p className="text-[11px] text-amber-600 mt-1">
                  All active expense categories currently have an assigned budget.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Spending Limit ({currency})
              </label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 500"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono font-medium rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                We will warn you when your spending reaches 80% and when it exceeds this amount.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableCategories.length === 0 && !budgetToEdit}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {budgetToEdit ? 'Save Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
