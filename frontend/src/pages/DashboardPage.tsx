import React, { useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PiggyBank, 
  Plus, 
  ArrowRight,
  Receipt,
  PieChart,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Transaction, NavigationTab } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatPercentage, formatDate } from '@/utils/currencies';
import { renderCategoryIcon } from '@/utils/categoryIcons';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenNewTransaction: () => void;
  onViewTransaction: (tx: Transaction) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewTransaction,
  onViewTransaction,
}) => {
  const { currentUser } = useAuth();
  const { transactions, budgets, categories, currency, convertAmount } = useFinance();
  const { t, language } = useLanguage();

  // Dynamic current & previous month resolution
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const monthName = now.toLocaleString(language === 'am' ? 'am-ET' : 'en-US', { month: 'long', year: 'numeric' });

  // Financial Calculations
  const stats = useMemo(() => {
    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    let prevMonthIncome = 0;
    let prevMonthExpense = 0;

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
        } else if (tx.date.startsWith(previousMonth)) {
          prevMonthExpense += val;
        }
      }
    }

    const netBalance = totalAllTimeIncome - totalAllTimeExpense;
    const currentMonthNet = currentMonthIncome - currentMonthExpense;
    const savingsRate = currentMonthIncome > 0 ? Math.max(0, (currentMonthNet / currentMonthIncome) * 100) : 0;

    const incomeGrowth = prevMonthIncome > 0 
      ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100 
      : 0;

    const expenseGrowth = prevMonthExpense > 0 
      ? ((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * 100 
      : 0;

    return {
      netBalance,
      currentMonthIncome,
      currentMonthExpense,
      currentMonthNet,
      savingsRate,
      incomeGrowth,
      expenseGrowth,
    };
  }, [transactions, currentMonth, previousMonth, convertAmount]);

  // Recent 5 Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [transactions]);

  // Budget Summary for Active Month
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
      const remaining = Math.max(0, b.monthlyLimit - spent);

      return {
        ...b,
        categoryName: cat?.name || 'Category',
        color: cat?.color || '#3B82F6',
        icon: cat?.icon || 'Tag',
        spent,
        pct,
        isExceeded,
        isWarning,
        remaining,
      };
    });
  }, [budgets, categories, transactions, currentMonth, convertAmount]);

  // Top Spending Categories this month
  const topSpendingCategories = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
        const val = convertAmount(tx.amount, tx.currency);
        map[tx.categoryId] = (map[tx.categoryId] || 0) + val;
        totalExpense += val;
      }
    }

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Other',
          color: cat?.color || '#64748B',
          icon: cat?.icon || 'Tag',
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [transactions, categories, currentMonth, convertAmount]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold tracking-tight">
              {t('dash.welcome', 'Good day')}, {currentUser?.name?.split(' ')[0] || 'there'}!
            </h1>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Financial summary and budget status for <strong className="text-white font-medium">{monthName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('nav.addTransaction', 'Add Transaction')}</span>
          </button>
        </div>
      </div>

      {/* Primary 4 Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Available Balance */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Total Balance</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(stats.netBalance, currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Available funds across all records
          </div>
        </div>

        {/* Monthly Inflow / Income */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Income This Month</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            +{formatCurrency(stats.currentMonthIncome, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            {stats.incomeGrowth !== 0 ? (
              <span className={`font-semibold font-mono ${stats.incomeGrowth >= 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                {stats.incomeGrowth >= 0 ? '+' : ''}{formatPercentage(stats.incomeGrowth)}
              </span>
            ) : null}
            <span>compared to last month</span>
          </div>
        </div>

        {/* Monthly Outflow / Expenses */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Spending This Month</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            -{formatCurrency(stats.currentMonthExpense, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            {stats.expenseGrowth !== 0 ? (
              <span className="text-slate-700 font-semibold font-mono">
                {stats.expenseGrowth >= 0 ? '+' : ''}{formatPercentage(stats.expenseGrowth)}
              </span>
            ) : null}
            <span>compared to last month</span>
          </div>
        </div>

        {/* Net Savings & Rate */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Savings This Month</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(stats.currentMonthNet, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold font-mono">
              {formatPercentage(stats.savingsRate)}
            </span>
            <span>of monthly income saved</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Spending Breakdown & Budget Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Where is my money going? (Top Spending Categories) */}
        <div className="lg:col-span-6 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Where Is Your Money Going?
                </h3>
                <p className="text-xs text-slate-500">
                  Top spending categories for this month
                </p>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
              >
                <span>Insights</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {topSpendingCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <PieChart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No expenses recorded for this month yet.</p>
                <button
                  onClick={onOpenNewTransaction}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Record an expense
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {topSpendingCategories.map((c) => (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({formatPercentage(c.percentage)})
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        {formatCurrency(c.amount, currency)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(c.percentage, 100)}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total monthly expenses:</span>
            <strong className="text-slate-900 font-mono">
              {formatCurrency(stats.currentMonthExpense, currency)}
            </strong>
          </div>
        </div>

        {/* Am I staying within budget? (Budget Tracking) */}
        <div className="lg:col-span-6 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Budget Tracking
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly spending limits & remaining balance
                </p>
              </div>
              <button
                onClick={() => onNavigate('budgets')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
              >
                <span>View all ({budgets.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {budgetSummary.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No monthly budgets set up yet.</p>
                <button
                  onClick={() => onNavigate('budgets')}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Set your first budget target
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {budgetSummary.map((b) => (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="font-medium text-slate-800">{b.categoryName}</span>
                      </div>
                      <span className="font-mono tabular-nums text-slate-600">
                        {formatCurrency(b.spent, currency)} / {formatCurrency(b.monthlyLimit, currency)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          b.isExceeded
                            ? 'bg-rose-500'
                            : b.isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{formatPercentage(b.pct)} used</span>
                      <span className={b.isExceeded ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                        {b.isExceeded ? 'Exceeded limit' : `${formatCurrency(b.remaining, currency)} remaining`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Keep your spending under 80% to maintain savings.</span>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Adjust limits
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Your latest financial activities
            </p>
          </div>

          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No transactions recorded yet.</p>
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
                        <span>{category?.name || 'General'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatDate(tx.date, language)}</span>
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
                      {isExpense ? '-' : '+'}{formatCurrency(tx.amount, tx.currency, true, language)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {tx.currency !== currency
                        ? `≈ ${formatCurrency(converted, currency, true, language)}`
                        : tx.paymentMethod}
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
