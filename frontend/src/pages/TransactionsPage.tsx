/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  CreditCard,
  Repeat,
  ArrowUpDown,
} from 'lucide-react';
import { Transaction } from '@/types';
import { useFinance } from '@/context/FinanceContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatDate } from '@/utils/currencies';
import { renderCategoryIcon } from '@/utils/categoryIcons';

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
    deleteTransaction,
    exportTransactionsToCSV,
    convertAmount,
    requestConfirmation,
  } = useFinance();
  const { t } = useLanguage();

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'thisMonth' | 'lastMonth'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const currentMonth = '2026-10';
  const previousMonth = '2026-09';

  // Filtered & sorted records
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description?.toLowerCase().includes(q);
        const matchMerchant = tx.merchant?.toLowerCase().includes(q);
        const matchNotes = tx.notes?.toLowerCase().includes(q);
        if (!matchDesc && !matchMerchant && !matchNotes) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter === 'thisMonth' && !tx.date.startsWith(currentMonth)) {
        return false;
      }
      if (dateRangeFilter === 'lastMonth' && !tx.date.startsWith(previousMonth)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount-desc') {
        return convertAmount(b.amount, b.currency) - convertAmount(a.amount, a.currency);
      }
      if (sortBy === 'amount-asc') {
        return convertAmount(a.amount, a.currency) - convertAmount(b.amount, b.currency);
      }
      return 0;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, dateRangeFilter, sortBy, convertAmount]);

  // Totals for filtered records
  const { filteredIncome, filteredExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      const converted = convertAmount(tx.amount, tx.currency);
      if (tx.type === 'income') {
        income += converted;
      } else {
        expense += converted;
      }
    }
    return { filteredIncome: income, filteredExpense: expense };
  }, [filteredTransactions, convertAmount]);

  const handleDelete = (tx: Transaction) => {
    requestConfirmation({
      title: t('tx.deleteTitle', 'Delete Transaction'),
      message: t(
        'tx.deleteConfirm',
        'Are you sure you want to delete this transaction record? This action cannot be undone.'
      ),
      isDestructive: true,
      onConfirm: () => deleteTransaction(tx.id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('tx.title', 'Transaction Ledger')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('tx.subtitle', 'Complete history of your income deposits and expense payments.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportTransactionsToCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('tx.exportCsv', 'Export CSV')}</span>
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('tx.newEntry', 'New Entry')}</span>
          </button>
        </div>
      </div>

      {/* Filter Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('tx.filteredIncome', 'Filtered Income')}
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
            +{formatCurrency(filteredIncome, currency)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('tx.filteredExpenses', 'Filtered Expenses')}
          </span>
          <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
            -{formatCurrency(filteredExpense, currency)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('tx.netFlow', 'Net Flow')}
          </span>
          <span
            className={`text-xl font-bold font-mono mt-1 block ${
              filteredIncome - filteredExpense >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(filteredIncome - filteredExpense, currency)}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tx.searchPlaceholder', 'Search description, merchant, or notes...')}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-slate-900"
          >
            <option value="all">{t('tx.allTypes', 'All Types')}</option>
            <option value="expense">{t('tx.expenses', 'Expenses')}</option>
            <option value="income">{t('tx.income', 'Income')}</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-slate-900 max-w-[160px]"
          >
            <option value="all">{t('tx.allCategories', 'All Categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Date Period Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-slate-900"
          >
            <option value="all">{t('tx.allTime', 'All Time')}</option>
            <option value="thisMonth">{t('tx.thisMonth', 'This Month')}</option>
            <option value="lastMonth">{t('tx.lastMonth', 'Last Month')}</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-slate-900"
          >
            <option value="date-desc">{t('tx.sortNewest', 'Newest First')}</option>
            <option value="date-asc">{t('tx.sortOldest', 'Oldest First')}</option>
            <option value="amount-desc">{t('tx.sortHighest', 'Highest Amount')}</option>
            <option value="amount-asc">{t('tx.sortLowest', 'Lowest Amount')}</option>
          </select>
        </div>
      </div>

      {/* Transactions Table / Empty State */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              {t('tx.emptyTitle', 'No transactions found')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t('tx.emptyDesc', 'You have not logged any transactions yet or no records match your filter criteria.')}
            </p>
            <button
              onClick={onOpenNewTransaction}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              {t('tx.newEntry', 'Log New Transaction')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('tx.colDesc', 'Transaction / Merchant')}</th>
                  <th className="py-3 px-4">{t('tx.colCategory', 'Category')}</th>
                  <th className="py-3 px-4">{t('tx.colDate', 'Date')}</th>
                  <th className="py-3 px-4">{t('tx.colMethod', 'Method')}</th>
                  <th className="py-3 px-4 text-right">{t('tx.colAmount', 'Amount')}</th>
                  <th className="py-3 px-4 text-right">{t('tx.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onViewTransaction(tx)}
                    >
                      {/* Description & Merchant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {renderCategoryIcon(cat?.icon || 'Tag', 'w-4 h-4')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {tx.description}
                              </span>
                              {tx.isRecurring && (
                                <span className="inline-flex items-center text-[10px] text-slate-400 font-medium" title={t('tx.recurring', 'Recurring')}>
                                  <Repeat className="w-3 h-3 text-slate-400" />
                                </span>
                              )}
                            </div>
                            {tx.merchant && (
                              <p className="text-[11px] text-slate-500">
                                {tx.merchant}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                          {cat?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-600' : 'text-slate-900'}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                            title={t('common.view', 'View Details')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                            title={t('common.edit', 'Edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title={t('common.delete', 'Delete')}
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
        )}
      </div>
    </div>
  );
};

export const TransactionsPage = TransactionsView;
