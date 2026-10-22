import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  PieChart, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Trash2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Budget } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../utils/currencies';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { BudgetModal } from './BudgetModal';
import { EmptyState } from '../common/EmptyState';

export const BudgetsView: React.FC = () => {
  const { 
    budgets, 
    categories, 
    transactions, 
    currency, 
    convertAmount, 
    deleteBudget,
    setCategoryBudget,
    requestConfirmation 
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  // Month reference (October 2026)
  const currentMonth = '2026-10';

  // Compute category spending for the current month
  const categorySpendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        const converted = convertAmount(tx.amount, tx.currency);
        map[tx.categoryId] = (map[tx.categoryId] || 0) + converted;
      }
    }
    return map;
  }, [transactions, currentMonth, convertAmount]);

  // Overall totals across all active budgets
  const summary = useMemo(() => {
    let totalAllocated = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    let warningCount = 0;

    for (const b of budgets) {
      const spent = categorySpendingMap[b.categoryId] || 0;
      totalAllocated += b.monthlyLimit;
      totalSpent += spent;

      const pct = (spent / b.monthlyLimit) * 100;
      if (pct >= 100) {
        exceededCount++;
      } else if (pct >= 80) {
        warningCount++;
      }
    }

    const remaining = totalAllocated - totalSpent;
    const overallPct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return {
      totalAllocated,
      totalSpent,
      remaining,
      overallPct,
      exceededCount,
      warningCount,
    };
  }, [budgets, categorySpendingMap]);

  const handleEdit = (budget: Budget) => {
    setBudgetToEdit(budget);
    setIsModalOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    const cat = categories.find((c) => c.id === budget.categoryId);
    requestConfirmation({
      title: 'Remove Budget Allocation',
      message: `Are you sure you want to remove the monthly spending limit for "${cat?.name || 'this category'}"?`,
      confirmLabel: 'Remove Budget',
      isDestructive: true,
      onConfirm: () => deleteBudget(budget.id),
    });
  };

  const handleAutoSuggestBudgets = () => {
    // Generate suggested budgets for key expense categories
    const suggestions: Record<string, number> = {
      'cat-housing': 2200,
      'cat-food': 750,
      'cat-transport': 300,
      'cat-utilities': 280,
      'cat-shopping': 450,
      'cat-entertainment': 250,
      'cat-healthcare': 180,
      'cat-education': 150,
    };

    Object.entries(suggestions).forEach(([catId, limit]) => {
      setCategoryBudget(catId, limit, currentMonth);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Monthly Spending Budgets
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Target limits and actual expenses for October 2026.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {budgets.length === 0 && (
            <button
              onClick={handleAutoSuggestBudgets}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Load Suggested Budgets</span>
            </button>
          )}

          <button
            onClick={() => {
              setBudgetToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Set New Budget</span>
          </button>
        </div>
      </div>

      {/* Aggregate Budget Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Total Allocated</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(summary.totalAllocated, currency)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Across {budgets.length} categories
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Total Spent</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(summary.totalSpent, currency)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {formatPercentage(summary.overallPct)} of total pool
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Remaining Buffer</span>
          <span
            className={`text-xl font-bold font-mono tabular-nums ${
              summary.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(summary.remaining, currency)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {summary.remaining >= 0 ? 'Unspent allocation' : 'Overall deficit'}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Health Status</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {summary.exceededCount > 0 ? (
              <span className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {summary.exceededCount} Over limit
              </span>
            ) : summary.warningCount > 0 ? (
              <span className="text-sm font-semibold text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {summary.warningCount} Near limit
              </span>
            ) : (
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                All on track
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Target threshold: 80%
          </span>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No spending budgets configured"
          description="Setting monthly spending targets helps you control expenses, prevent lifestyle creep, and reach your savings goals faster."
          actionLabel="Load Suggested Budgets"
          onAction={handleAutoSuggestBudgets}
          secondaryActionLabel="Add Custom Budget"
          onSecondaryAction={() => {
            setBudgetToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const category = categories.find((c) => c.id === b.categoryId);
            const spent = categorySpendingMap[b.categoryId] || 0;
            const pct = Math.min((spent / b.monthlyLimit) * 100, 100);
            const rawPct = (spent / b.monthlyLimit) * 100;
            const remaining = b.monthlyLimit - spent;
            const isExceeded = spent > b.monthlyLimit;
            const isWarning = !isExceeded && rawPct >= 80;

            // Bar color logic
            let barColor = 'bg-emerald-500';
            let statusTextColor = 'text-emerald-700';
            let statusLabel = 'On track';
            let StatusIcon = CheckCircle2;

            if (isExceeded) {
              barColor = 'bg-rose-500';
              statusTextColor = 'text-rose-700';
              statusLabel = `Exceeded by ${formatCurrency(Math.abs(remaining), currency)}`;
              StatusIcon = AlertCircle;
            } else if (isWarning) {
              barColor = 'bg-amber-500';
              statusTextColor = 'text-amber-700';
              statusLabel = `Approaching limit (${formatPercentage(rawPct)})`;
              StatusIcon = AlertTriangle;
            }

            return (
              <div
                key={b.id}
                className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs group"
              >
                <div>
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 shrink-0"
                        style={{ color: category?.color || '#3B82F6' }}
                      >
                        {renderCategoryIcon(category?.icon || 'Tag', 'w-5 h-5')}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {category?.name || 'Category'}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Monthly limit: {formatCurrency(b.monthlyLimit, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(b)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Adjust limit"
                        aria-label="Adjust limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Remove budget"
                        aria-label="Remove budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Spending Numbers */}
                  <div className="mt-5 flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Spent this month</span>
                      <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                        {formatCurrency(spent, currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] block">
                        {isExceeded ? 'Over limit' : 'Remaining'}
                      </span>
                      <span
                        className={`text-base font-bold font-mono tabular-nums ${
                          isExceeded ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {formatCurrency(Math.abs(remaining), currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Status Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusTextColor}`} />
                    <span className={`text-[11px] font-medium ${statusTextColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 font-semibold tabular-nums">
                    {formatPercentage(rawPct)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBudgetToEdit(null);
        }}
        budgetToEdit={budgetToEdit}
      />
    </div>
  );
};
