import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowDownRight, 
  ArrowUpRight,
  Receipt,
  Eye,
  Calendar,
  X
} from 'lucide-react';
import { Transaction, TransactionType } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/currencies';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { EmptyState } from '../common/EmptyState';

interface TransactionsViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onViewTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
  onViewTransaction,
}) => {
  const { 
    transactions, 
    categories, 
    currency, 
    convertAmount, 
    deleteTransaction,
    requestConfirmation,
    exportTransactionsToCSV,
    importTransactionsFromCSV 
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'this-month' | 'last-month'>('this-month');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Current month prefix for filtering (e.g. "2026-10")
  const currentMonthStr = '2026-10';
  const lastMonthStr = '2026-09';

  // Filtered & Sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const merchant = (tx.merchant || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        if (!desc.includes(query) && !merchant.includes(query) && !notes.includes(query)) {
          return false;
        }
      }

      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) {
        return false;
      }

      // Time range
      if (timeFilter === 'this-month') {
        if (!tx.date.startsWith(currentMonthStr)) return false;
      } else if (timeFilter === 'last-month') {
        if (!tx.date.startsWith(lastMonthStr)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') {
        const amountA = convertAmount(a.amount, a.currency);
        const amountB = convertAmount(b.amount, b.currency);
        return amountB - amountA;
      }
      if (sortBy === 'amount-asc') {
        const amountA = convertAmount(a.amount, a.currency);
        const amountB = convertAmount(b.amount, b.currency);
        return amountA - amountB;
      }
      return 0;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, timeFilter, sortBy, convertAmount]);

  // Aggregate stats for the currently filtered set
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      const val = convertAmount(tx.amount, tx.currency);
      if (tx.type === 'income') {
        income += val;
      } else {
        expense += val;
      }
    }
    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions, convertAmount]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importTransactionsFromCSV(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = (tx: Transaction) => {
    requestConfirmation({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete "${tx.description}"?`,
      confirmLabel: 'Delete',
      isDestructive: true,
      onConfirm: () => deleteTransaction(tx.id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant, or notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Import CSV transactions"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>
            <button
              onClick={exportTransactionsToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Export filtered transactions"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Segmented controls and Select Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => {
                setTypeFilter('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => {
                setTypeFilter('expense');
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'expense'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => {
                setTypeFilter('income');
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'income'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Time range Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => {
                setTimeFilter('this-month');
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeFilter === 'this-month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => {
                setTimeFilter('last-month');
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeFilter === 'last-month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => {
                setTimeFilter('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 text-xs focus:outline-hidden focus:border-slate-900"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 text-xs focus:outline-hidden focus:border-slate-900"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3.5 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Total Filtered Records</span>
          <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {stats.count} entries
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Filtered Income</span>
          <span className="text-lg font-bold font-mono text-emerald-600 tabular-nums">
            +{formatCurrency(stats.income, currency)}
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Filtered Expenses</span>
          <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            -{formatCurrency(stats.expense, currency)}
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block mb-1">Net Flow</span>
          <span
            className={`text-lg font-bold font-mono tabular-nums ${
              stats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net, currency)}
          </span>
        </div>
      </div>

      {/* Data Table */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description={
            transactions.length === 0
              ? 'You have not logged any transactions yet. Record your first transaction to start tracking.'
              : 'No transactions match the selected filters. Try broadening your search or resetting filters.'
          }
          actionLabel="Add Transaction"
          onAction={onOpenNewTransaction}
          secondaryActionLabel={
            searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || timeFilter !== 'all'
              ? 'Reset Filters'
              : undefined
          }
          onSecondaryAction={() => {
            setSearchQuery('');
            setTypeFilter('all');
            setCategoryFilter('all');
            setTimeFilter('all');
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction / Merchant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount ({currency})</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedTransactions.map((tx) => {
                  const category = categories.find((c) => c.id === tx.categoryId);
                  const isExpense = tx.type === 'expense';
                  const isForeign = tx.currency !== currency;
                  const displayConverted = convertAmount(tx.amount, tx.currency);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Description & Merchant */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 shrink-0"
                            style={{ color: category?.color || '#64748B' }}
                          >
                            {renderCategoryIcon(category?.icon || 'Tag', 'w-4 h-4')}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => onViewTransaction(tx)}
                              className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors text-left block truncate max-w-xs md:max-w-sm"
                            >
                              {tx.description}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span>{tx.merchant || 'Direct'}</span>
                              {tx.isRecurring && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-slate-400">Recurring</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium whitespace-nowrap">
                          {category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(tx.date)}
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            isExpense ? 'text-slate-900' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}{formatCurrency(displayConverted, currency)}
                        </span>
                        {isForeign && (
                          <span className="block text-[10px] text-slate-400">
                            Orig: {formatCurrency(tx.amount, tx.currency)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onViewTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="View details"
                            aria-label="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
              <span>
                Showing {(page - 1) * itemsPerPage + 1} to{' '}
                {Math.min(page * itemsPerPage, filteredTransactions.length)} of{' '}
                {filteredTransactions.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Previous
                </button>
                <span className="px-2 font-mono font-semibold text-slate-900">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
