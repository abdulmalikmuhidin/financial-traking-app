import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  Wallet,
  Receipt
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatPercentage } from '@/utils/currencies';
import { renderCategoryIcon } from '@/utils/categoryIcons';

export const AnalyticsPage: React.FC = () => {
  const { transactions, categories, currency, convertAmount } = useFinance();
  const { t, language } = useLanguage();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName = now.toLocaleString(language === 'am' ? 'am-ET' : 'en-US', { month: 'long', year: 'numeric' });

  // Analytics computation for the active month
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
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const avgDaily = totalOutflow / (daysInMonth || 30);

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

  // Dynamically compute real cash flow trends from transactions across last 5 calendar months
  const monthlyTrends = useMemo(() => {
    const months: { key: string; label: string; inflow: number; outflow: number }[] = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(language === 'am' ? 'am-ET' : 'en-US', { month: 'short', year: 'numeric' });
      months.push({ key, label, inflow: 0, outflow: 0 });
    }

    for (const tx of transactions) {
      const val = convertAmount(tx.amount, tx.currency);
      const monthPrefix = tx.date.slice(0, 7);
      const target = months.find((m) => m.key === monthPrefix);
      if (target) {
        if (tx.type === 'income') {
          target.inflow += val;
        } else {
          target.outflow += val;
        }
      }
    }

    return months;
  }, [transactions, convertAmount, language]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">
          {t('an.title', 'Spending Insights & Cash Flow')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('an.subtitle', 'Clear breakdown of your income deposits, category expenses, and monthly savings.')}
        </p>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-600">Total Income</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-emerald-600 block">
            +{formatCurrency(data.totalInflow, currency, true, language)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">{monthName}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-600">Total Spending</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-slate-900 block">
            -{formatCurrency(data.totalOutflow, currency, true, language)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">{monthName}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-600">Net Savings</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <span
            className={`text-xl font-bold font-mono block ${
              data.netSavings >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(data.netSavings, currency, true, language)}
          </span>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            {formatPercentage(data.savingsRate)} savings rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-600">Daily Average</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-slate-900 block">
            {formatCurrency(data.avgDaily, currency, true, language)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Daily spending rate</span>
        </div>
      </div>

      {/* Grid: Cash Flow Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Comparison */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Monthly Cash Flow
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Income deposits vs. expense disbursements
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Spending
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {monthlyTrends.map((m) => {
                const maxVal = Math.max(...monthlyTrends.map((x) => Math.max(x.inflow, x.outflow)), 100);
                const inWidth = maxVal > 0 ? Math.min((m.inflow / maxVal) * 100, 100) : 0;
                const outWidth = maxVal > 0 ? Math.min((m.outflow / maxVal) * 100, 100) : 0;

                return (
                  <div key={m.key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{m.label}</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        +{formatCurrency(m.inflow, currency, true, language)} / -{formatCurrency(m.outflow, currency, true, language)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(inWidth, 2)}%` }}
                        />
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-slate-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(outWidth, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Spending Breakdown */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Spending by Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Expense distribution for {monthName}
              </p>
            </div>

            <div className="mt-5 space-y-3.5">
              {data.sortedCategories.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No expenses recorded for this month.</p>
                </div>
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
                          {formatCurrency(cat.amount, currency, true, language)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
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
    </div>
  );
};
