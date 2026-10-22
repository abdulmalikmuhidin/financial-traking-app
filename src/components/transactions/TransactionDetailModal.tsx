import React from 'react';
import { X, Edit2, Trash2, Calendar, CreditCard, Tag, Repeat } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/currencies';
import { renderCategoryIcon } from '../../utils/categoryIcons';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onEdit,
}) => {
  const { categories, currency, convertAmount, deleteTransaction, requestConfirmation } = useFinance();

  if (!transaction) return null;

  const category = categories.find((c) => c.id === transaction.categoryId);
  const isExpense = transaction.type === 'expense';
  const isForeignCurrency = transaction.currency !== currency;
  const convertedAmount = convertAmount(transaction.amount, transaction.currency);

  const handleDelete = () => {
    requestConfirmation({
      title: 'Delete Transaction',
      message: `Are you sure you want to permanently delete "${transaction.description}"? This action cannot be undone.`,
      confirmLabel: 'Delete Transaction',
      isDestructive: true,
      onConfirm: () => {
        deleteTransaction(transaction.id);
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Transaction Details
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Hero */}
        <div className="px-6 pt-6 pb-4 text-center bg-slate-50/50 border-b border-slate-100">
          <div className="inline-flex items-center justify-center p-2 rounded-lg bg-white shadow-xs border border-slate-200 mb-3" style={{ color: category?.color || '#64748B' }}>
            {renderCategoryIcon(category?.icon || 'Tag', 'w-6 h-6')}
          </div>
          <h3 className="text-sm font-semibold text-slate-800">{transaction.description}</h3>
          {transaction.merchant && (
            <p className="text-xs text-slate-500 mt-0.5">{transaction.merchant}</p>
          )}

          <div className="mt-3">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                isExpense ? 'text-slate-900' : 'text-emerald-600'
              }`}
            >
              {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, transaction.currency)}
            </span>

            {isForeignCurrency && (
              <p className="text-xs text-slate-500 font-mono mt-1">
                ≈ {formatCurrency(convertedAmount, currency)} ({currency} base)
              </p>
            )}
          </div>
        </div>

        {/* Metadata Specs */}
        <div className="p-6 space-y-3.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Tag className="w-3.5 h-3.5" /> Category
            </span>
            <span className="font-semibold text-slate-900">{category?.name || 'Uncategorized'}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-3.5 h-3.5" /> Date
            </span>
            <span className="font-semibold text-slate-900">{formatDate(transaction.date)}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <CreditCard className="w-3.5 h-3.5" /> Payment Method
            </span>
            <span className="font-semibold text-slate-900">{transaction.paymentMethod}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Repeat className="w-3.5 h-3.5" /> Schedule
            </span>
            <span className="font-semibold text-slate-900">
              {transaction.isRecurring ? 'Monthly recurring' : 'One-time transaction'}
            </span>
          </div>

          {transaction.notes && (
            <div className="pt-2">
              <span className="block text-slate-500 mb-1 font-medium">Notes</span>
              <p className="p-2.5 rounded-lg bg-slate-50 text-slate-700 leading-relaxed border border-slate-100">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
