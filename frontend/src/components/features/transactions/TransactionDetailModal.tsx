/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  Building,
  FileText,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Transaction } from '@/types';
import { useFinance } from '@/context/FinanceContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatDate } from '@/utils/currencies';
import { renderCategoryIcon } from '@/utils/categoryIcons';

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
  const { categories, deleteTransaction, requestConfirmation } = useFinance();
  const { t } = useLanguage();

  if (!transaction) return null;

  const cat = categories.find((c) => c.id === transaction.categoryId);
  const isIncome = transaction.type === 'income';

  const handleDelete = () => {
    requestConfirmation({
      title: t('tx.deleteTitle', 'Delete Transaction'),
      message: t(
        'tx.deleteConfirm',
        'Are you sure you want to delete this transaction record? This action cannot be undone.'
      ),
      isDestructive: true,
      onConfirm: () => {
        deleteTransaction(transaction.id);
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isIncome ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <h2 className="text-sm font-bold text-slate-900">
              {t('tx.detailTitle', 'Transaction Details')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Amount Showcase */}
          <div className="text-center py-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                isIncome ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
            </span>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              {transaction.description}
            </p>
            {transaction.isRecurring && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium mt-2">
                <Repeat className="w-3 h-3" />
                <span>{t('tx.recurring', 'Recurring')}</span>
              </span>
            )}
          </div>

          {/* Key-Value Breakdown */}
          <div className="space-y-3 bg-slate-50/75 rounded-xl p-4 border border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {t('common.category', 'Category')}
              </span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                {renderCategoryIcon(cat?.icon || 'Tag', 'w-3.5 h-3.5 text-slate-500')}
                {cat?.name || 'Uncategorized'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {t('common.date', 'Date')}
              </span>
              <span className="font-mono text-slate-900">
                {formatDate(transaction.date)}
              </span>
            </div>

            {transaction.merchant && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {t('tx.merchantLabel', 'Merchant / Payee')}
                </span>
                <span className="font-medium text-slate-900">
                  {transaction.merchant}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                {t('tx.paymentMethodLabel', 'Payment Method')}
              </span>
              <span className="font-medium text-slate-900">
                {transaction.paymentMethod}
              </span>
            </div>
          </div>

          {transaction.notes && (
            <div className="bg-slate-50/75 rounded-xl p-3.5 border border-slate-100 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {t('common.notes', 'Notes')}
              </span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('common.delete', 'Delete')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              {t('common.close', 'Close')}
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{t('common.edit', 'Edit')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
