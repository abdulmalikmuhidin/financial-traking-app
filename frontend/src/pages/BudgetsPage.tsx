/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { Budget } from '@/types';
import { useFinance } from '@/context/FinanceContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatPercentage } from '@/utils/currencies';
import { renderCategoryIcon } from '@/utils/categoryIcons';
import { INITIAL_DEMO_BUDGETS } from '@/utils/mockData';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    currency,
    convertAmount,
    setCategoryBudget,
    deleteBudget,
    requestConfirmation,
  } = useFinance();
  const { t } = useLanguage();

  const currentMonth = '2026-10';

  // Budget Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Calculate actual spending per category for currentMonth
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        const val = convertAmount(tx.amount, tx.currency);
        map[tx.categoryId] = (map[tx.categoryId] || 0) + val;
      }
    }
    return map;
  }, [transactions, convertAmount]);

  // Overall totals
  const { totalAllocated, totalSpent, onTrackCount, nearLimitCount, overLimitCount } = useMemo(() => {
    let allocated = 0;
    let spent = 0;
    let onTrack = 0;
    let nearLimit = 0;
    let overLimit = 0;

    for (const b of budgets) {
      if (b.month === currentMonth) {
        const limitVal = convertAmount(b.monthlyLimit, b.currency);
        const spentVal = categorySpending[b.categoryId] || 0;
        allocated += limitVal;
        spent += spentVal;

        const ratio = limitVal > 0 ? (spentVal / limitVal) * 100 : 0;
        if (ratio > 100) {
          overLimit++;
        } else if (ratio >= 80) {
          nearLimit++;
        } else {
          onTrack++;
        }
      }
    }

    return {
      totalAllocated: allocated,
      totalSpent: spent,
      onTrackCount: onTrack,
      nearLimitCount: nearLimit,
      overLimitCount: overLimit,
    };
  }, [budgets, categorySpending, convertAmount]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleOpenBudgetModal = (categoryId?: string, currentLimit?: number) => {
    setSelectedCatId(categoryId || expenseCategories[0]?.id || '');
    setLimitInput(currentLimit ? currentLimit.toString() : '');
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const parsedLimit = parseFloat(limitInput);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setModalError('Please enter a valid monthly limit amount.');
      return;
    }

    await setCategoryBudget(selectedCatId, parsedLimit, currentMonth);
    setModalOpen(false);
  };

  const handleDeleteBudget = (budget: Budget) => {
    requestConfirmation({
      title: t('bgt.deleteTitle', 'Remove Budget Limit'),
      message: t('bgt.deleteConfirm', 'Are you sure you want to remove the monthly limit for this category?'),
      isDestructive: true,
      onConfirm: () => deleteBudget(budget.id),
    });
  };

  const handleLoadDefaults = () => {
    INITIAL_DEMO_BUDGETS.forEach((b) => {
      setCategoryBudget(b.categoryId, b.monthlyLimit, currentMonth);
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('bgt.title', 'Monthly Spending Budgets')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('bgt.subtitle', 'Target limits and actual expenses for October 2026.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {budgets.length === 0 && (
            <button
              onClick={handleLoadDefaults}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('bgt.suggested', 'Load Suggested Budgets')}</span>
            </button>
          )}
          <button
            onClick={() => handleOpenBudgetModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('bgt.newBudget', 'Set New Budget')}</span>
          </button>
        </div>
      </div>

      {/* Top Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('bgt.totalAllocated', 'Total Allocated')}
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalAllocated, currency)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('bgt.totalSpent', 'Total Spent')}
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(totalSpent, currency)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('bgt.remaining', 'Remaining Buffer')}
          </span>
          <span
            className={`text-xl font-bold font-mono mt-1 block ${
              totalAllocated - totalSpent >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(totalAllocated - totalSpent, currency)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('bgt.healthStatus', 'Health Status')}
          </span>
          <div className="flex items-center gap-2 mt-1.5 text-xs font-medium">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
              {onTrackCount} {t('bgt.onTrack', 'On track')}
            </span>
            {overLimitCount > 0 && (
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono">
                {overLimitCount} {t('bgt.overLimit', 'Over')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t('bgt.emptyTitle', 'No spending budgets configured')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {t('bgt.emptyDesc', 'Setting monthly spending targets helps you control expenses and reach your savings goals faster.')}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={handleLoadDefaults}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {t('bgt.suggested', 'Load Suggested Budgets')}
            </button>
            <button
              onClick={() => handleOpenBudgetModal()}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              {t('bgt.newBudget', 'Set First Budget')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const limit = convertAmount(b.monthlyLimit, b.currency);
            const spent = categorySpending[b.categoryId] || 0;
            const remaining = limit - spent;
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isOver = spent > limit;
            const isNear = percentage >= 80 && !isOver;

            let barColor = 'bg-emerald-500';
            let badgeText = t('bgt.onTrack', 'On track');
            let badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';

            if (isOver) {
              barColor = 'bg-rose-500';
              badgeText = t('bgt.overLimit', 'Over limit');
              badgeClass = 'text-rose-700 bg-rose-50 border-rose-200';
            } else if (isNear) {
              barColor = 'bg-amber-500';
              badgeText = t('bgt.nearLimit', 'Near limit (80%+)');
              badgeClass = 'text-amber-700 bg-amber-50 border-amber-200';
            }

            return (
              <div
                key={b.id}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        {renderCategoryIcon(cat?.icon || 'Tag', 'w-4 h-4')}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {cat?.name || 'Category'}
                        </h4>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClass} mt-0.5`}>
                          {badgeText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenBudgetModal(b.categoryId, b.monthlyLimit)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                        title={t('common.edit', 'Edit Limit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(b)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title={t('common.delete', 'Remove Budget')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 my-4">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                      <span>{formatPercentage(percentage)} used</span>
                      <span>{formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer remaining */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {isOver ? t('bgt.overLimitLabel', 'Over limit') : t('bgt.remainingLabel', 'Remaining')}
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      isOver ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {isOver ? '-' : '+'}{formatCurrency(Math.abs(remaining), currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set Budget Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {t('bgt.setLimitModalTitle', 'Set Category Spending Limit')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              {modalError && (
                <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('bgt.category', 'Category')}
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('bgt.limitAmountLabel', 'Monthly Limit Amount')} ({currency})
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  {t('common.save', 'Save Budget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const BudgetsPage = BudgetsView;
