/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
  Wallet,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatPercentage } from '@/utils/currencies';
import { renderCategoryIcon } from '@/utils/categoryIcons';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories, currency, convertAmount } = useFinance();
  const { t } = useLanguage();

  const currentMonth = '2026-10';

  // Analytics computation
  const data = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let largestExpense = 0;
    let largestExpenseDesc = '';

    const categoryTotals: Record<string, number> = {};

    for (const tx of transactions) {
      const val = convertAmount(tx.amount, tx.currency);

      if (tx.type === 'income') {
        if (tx.date.startsWith(currentMonth)) {
          totalInflow += val;
        }
      } else {
        if (tx.date.startsWith(currentMonth)) {
          totalOutflow += val;
          categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + val;

          if (val > largestExpense) {
            largestExpense = val;
            largestExpenseDesc = tx.description;
          }
        }
      }
    }

    const netSavings = totalInflow - totalOutflow;
    const savingsRate = totalInflow > 0 ? Math.max(0, (netSavings / totalInflow) * 100) : 0;
    const avgDaily = totalOutflow / 31;

    // Top categories array
    const sortedCategories = Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Other',
          icon: cat?.icon || 'Tag',
          color: cat?.color || '#64748B',
          amount,
          percentage: totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      totalInflow,
      totalOutflow,
      netSavings,
      savingsRate,
      avgDaily,
      largestExpense,
      largestExpenseDesc,
      sortedCategories,
    };
  }, [transactions, categories, currentMonth, convertAmount]);

  // Cash flow trend mock table/comparison (Last 5 months)
  const monthlyTrends = [
    { month: 'Jun 2026', inflow: 11200, outflow: 3450 },
    { month: 'Jul 2026', inflow: 11500, outflow: 3600 },
    { month: 'Aug 2026', inflow: 11200, outflow: 3850 },
    { month: 'Sep 2026', inflow: 12400, outflow: 3520 },
    { month: 'Oct 2026', inflow: data.totalInflow || 13290, outflow: data.totalOutflow || 3666.69 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="pb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {t('an.title', 'Financial Analytics & Insights')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('an.subtitle', 'Holistic breakdown of cashflow, spending distribution, and savings trajectory.')}
        </p>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('an.inflow', 'Total Inflow')}
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
            +{formatCurrency(data.totalInflow, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">October 2026</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('an.outflow', 'Total Outflow')}
          </span>
          <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
            -{formatCurrency(data.totalOutflow, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">October 2026</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('an.net', 'Net Savings')}
          </span>
          <span
            className={`text-xl font-bold font-mono mt-1 block ${
              data.netSavings >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(data.netSavings, currency)}
          </span>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            {formatPercentage(data.savingsRate)} savings rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('an.avgDaily', 'Average Daily Spend')}
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrency(data.avgDaily, currency)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Across 31 calendar days</span>
        </div>
      </div>

      {/* Grid: Cash Flow Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Comparison */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('an.cashflowComp', 'Cash Flow Comparison (Last 5 Months)')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly income deposits vs. living expense disbursements.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Outflow
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {monthlyTrends.map((m) => {
              const maxVal = 15000;
              const inWidth = Math.min((m.inflow / maxVal) * 100, 100);
              const outWidth = Math.min((m.outflow / maxVal) * 100, 100);

              return (
                <div key={m.month} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{m.month}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      +{formatCurrency(m.inflow, currency)} / -{formatCurrency(m.outflow, currency)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${inWidth}%` }} />
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-rose-400 h-2 rounded-full" style={{ width: `${outWidth}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Spending Breakdown */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              {t('an.byCategory', 'Spending by Category')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked distribution of living expenses for October 2026.
            </p>
          </div>

          <div className="mt-5 space-y-3.5">
            {data.sortedCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No expense activity logged for this month.
              </p>
            ) : (
              data.sortedCategories.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-slate-100 text-slate-700">
                        {renderCategoryIcon(cat.icon, 'w-3 h-3')}
                      </span>
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-500">{formatPercentage(cat.percentage)}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(cat.amount, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color || '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsPage = AnalyticsView;
