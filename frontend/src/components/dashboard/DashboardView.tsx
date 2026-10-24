import React, { useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PiggyBank, 
  Plus, 
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Transaction, NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, formatPercentage, formatDate } from '../../utils/currencies';
import { renderCategoryIcon } from '../../utils/categoryIcons';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenNewTransaction: () => void;
  onViewTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewTransaction,
  onViewTransaction,
}) => {
  const { currentUser } = useAuth();
  const { transactions, budgets, categories, currency, convertAmount } = useFinance();
  const { t } = useLanguage();

  const currentMonth = '2026-10';
  const previousMonth = '2026-09';

  // Overall Financial Calculations
  const stats = useMemo(() => {
    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    let prevMonthIncome = 0;
    let prevMonthExpense = 0;

    // Daily spending accumulator for October 2026
    const dailySpending: Record<number, number> = {};
    for (let day = 1; day <= 31; day++) {
      dailySpending[day] = 0;
    }

    for (const tx of transactions) {
      const val = convertAmount(tx.amount, tx.currency);

      if (tx.type === 'income') {
        totalAllTimeIncome += val;
        if (tx.date.startsWith(currentMonth)) {
          currentMonthIncome += val;
        } else if (tx.date.startsWith(previousMonth)) {
          prevMonthIncome += val;
        }
      } else {
        totalAllTimeExpense += val;
        if (tx.date.startsWith(currentMonth)) {
          currentMonthExpense += val;
          const dayNum = parseInt(tx.date.split('-')[2], 10);
          if (!isNaN(dayNum)) {
            dailySpending[dayNum] = (dailySpending[dayNum] || 0) + val;
          }
        } else if (tx.date.startsWith(previousMonth)) {
          prevMonthExpense += val;
        }
      }
    }

    const netWorth = totalAllTimeIncome - totalAllTimeExpense;
    const currentMonthNet = currentMonthIncome - currentMonthExpense;
    const savingsRate = currentMonthIncome > 0 ? Math.max(0, (currentMonthNet / currentMonthIncome) * 100) : 0;

    const incomeGrowth = prevMonthIncome > 0 
      ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100 
      : 0;

    const expenseGrowth = prevMonthExpense > 0 
      ? ((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * 100 
      : 0;

    return {
      netWorth,
      currentMonthIncome,
      currentMonthExpense,
      currentMonthNet,
      savingsRate,
      incomeGrowth,
      expenseGrowth,
      dailySpending,
    };
  }, [transactions, currentMonth, previousMonth, convertAmount]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [transactions]);

  const budgetSummary = useMemo(() => {
    const spendingByCat: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        const val = convertAmount(tx.amount, tx.currency);
        spendingByCat[tx.categoryId] = (spendingByCat[tx.categoryId] || 0) + val;
      }
    }

    return budgets.slice(0, 4).map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = spendingByCat[b.categoryId] || 0;
      const pct = Math.min((spent / b.monthlyLimit) * 100, 100);
      const isExceeded = spent > b.monthlyLimit;
      const isWarning = !isExceeded && (spent / b.monthlyLimit) >= 0.8;

      return {
        ...b,
        categoryName: cat?.name || 'Category',
        color: cat?.color || '#3B82F6',
        icon: cat?.icon || 'Tag',
        spent,
        pct,
        isExceeded,
        isWarning,
      };
    });
  }, [budgets, categories, transactions, currentMonth, convertAmount]);

  const maxDaySpend = useMemo(() => {
    const values = Object.values(stats.dailySpending);
    return Math.max(...values, 200);
  }, [stats.dailySpending]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner / Demo Notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold tracking-tight">
              {t('dash.welcome', 'Good day')}, {currentUser?.name?.split(' ')[0] || 'Member'}
            </h1>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {t('dash.realBanner', 'Here is your real-time financial trajectory and budget status for October 2026.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('nav.addTransaction', 'Record Transaction')}</span>
          </button>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t('dash.netBalance', 'Total Net Balance')}</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(stats.netWorth, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <span>{t('dash.netLiquidity', 'Cumulative liquidity in')} {currency}</span>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t('dash.inflows', 'October Inflows')}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            +{formatCurrency(stats.currentMonthIncome, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold font-mono">
              {stats.incomeGrowth >= 0 ? '+' : ''}{formatPercentage(stats.incomeGrowth)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t('dash.vsPrevMonth', 'vs September')}</span>
          </div>
        </div>

        {/* Monthly Expenses Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t('dash.outflows', 'October Outflows')}</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            -{formatCurrency(stats.currentMonthExpense, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="text-slate-700 font-semibold font-mono">
              {stats.expenseGrowth >= 0 ? '+' : ''}{formatPercentage(stats.expenseGrowth)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t('dash.vsPrevMonth', 'vs September')}</span>
          </div>
        </div>

        {/* Net Savings & Rate Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t('dash.netSavings', 'Net Savings & Rate')}</span>
            <PiggyBank className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(stats.currentMonthNet, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold font-mono">
              {formatPercentage(stats.savingsRate)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t('dash.savedRate', 'of monthly income saved')}</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Daily Spending Trend Chart & Budgets Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Spending Rhythm */}
        <div className="lg:col-span-8 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {t('dash.dailyRhythm', 'Daily Spending Rhythm (October 2026)')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('dash.dailySub', 'Track day-by-day expense occurrences and peak spending spikes.')}
                </p>
              </div>

              <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {t('dash.peak', 'Peak')}: {formatCurrency(maxDaySpend, currency)}
              </span>
            </div>

            {/* SVG Daily Bar Strip */}
            <div className="h-44 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-100">
              {Array.from({ length: 22 }, (_, i) => i + 1).map((day) => {
                const amount = stats.dailySpending[day] || 0;
                const heightPct = amount > 0 ? Math.max((amount / maxDaySpend) * 100, 6) : 2;
                const hasSpend = amount > 0;

                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {hasSpend && (
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-sm">
                        Oct {day}: {formatCurrency(amount, currency)}
                      </div>
                    )}

                    <div
                      className={`w-full rounded-t-xs transition-all ${
                        hasSpend
                          ? 'bg-slate-900 group-hover:bg-emerald-600'
                          : 'bg-slate-100'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">
                      {day % 3 === 1 ? day : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{t('dash.monthTotal', 'Current Month Total')}: <strong className="text-slate-800 font-mono">{formatCurrency(stats.currentMonthExpense, currency)}</strong></span>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>{t('dash.fullAnalytics', 'Full Analytics')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Budget Progress Snapshot */}
        <div className="lg:col-span-4 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {t('dash.budgetTracking', 'Budget Tracking')}
              </h3>
              <button
                onClick={() => onNavigate('budgets')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                {t('dash.viewAll', 'View all')} ({budgets.length})
              </button>
            </div>

            {budgetSummary.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <p>No budgets configured for this month.</p>
                <button
                  onClick={() => onNavigate('budgets')}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Configure monthly targets
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetSummary.map((b) => (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="font-medium text-slate-800 truncate">
                          {b.categoryName}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-slate-600">
                        {formatCurrency(b.spent, currency)} / {formatCurrency(b.monthlyLimit, currency)}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          b.isExceeded
                            ? 'bg-rose-500'
                            : b.isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{t('dash.threshold', 'Threshold limit: 80%')}</span>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              {t('dash.adjustLimits', 'Adjust limits')}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions Ledger Preview */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {t('dash.recentTransactions', 'Recent Transactions')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('dash.recentSub', 'Latest financial activity recorded across your accounts.')}
            </p>
          </div>

          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <span>{t('dash.openLedger', 'Open Ledger')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No transactions logged yet.</p>
            <button
              onClick={onOpenNewTransaction}
              className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
            >
              Record your first transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              const isExpense = tx.type === 'expense';
              const converted = convertAmount(tx.amount, tx.currency);

              return (
                <div
                  key={tx.id}
                  onClick={() => onViewTransaction(tx)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100"
                      style={{ color: category?.color || '#64748B' }}
                    >
                      {renderCategoryIcon(category?.icon || 'Tag', 'w-4 h-4')}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{category?.name || 'Uncategorized'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatDate(tx.date)}</span>
                        {tx.merchant && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{tx.merchant}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <span
                      className={`text-xs font-bold ${
                        isExpense ? 'text-slate-900' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}{formatCurrency(converted, currency)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {tx.paymentMethod}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
