/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Calendar, DollarSign, Tag, Repeat } from 'lucide-react';
import { Transaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { categories, currency, addTransaction, updateTransaction } = useFinance();
  const { t } = useLanguage();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [txCurrency, setTxCurrency] = useState(currency);
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default form values on open or edit
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setTxCurrency(transactionToEdit.currency);
      setCategoryId(transactionToEdit.categoryId);
      setDate(transactionToEdit.date);
      setDescription(transactionToEdit.description);
      setMerchant(transactionToEdit.merchant || '');
      setPaymentMethod(transactionToEdit.paymentMethod || 'Credit Card');
      setNotes(transactionToEdit.notes || '');
      setIsRecurring(!!transactionToEdit.isRecurring);
    } else {
      setType('expense');
      setAmount('');
      setTxCurrency(currency);
      setCategoryId(categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '');
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setDescription('');
      setMerchant('');
      setPaymentMethod('Credit Card');
      setNotes('');
      setIsRecurring(false);
    }
    setError(null);
  }, [transactionToEdit, isOpen, currency, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description for the transaction.');
      return;
    }

    if (!categoryId) {
      setError('Please choose a category.');
      return;
    }

    if (!date) {
      setError('Please pick a date.');
      return;
    }

    if (transactionToEdit) {
      await updateTransaction(transactionToEdit.id, {
        type,
        amount: parsedAmount,
        currency: txCurrency,
        categoryId,
        date,
        description: description.trim(),
        merchant: merchant.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        isRecurring,
      });
    } else {
      await addTransaction({
        type,
        amount: parsedAmount,
        currency: txCurrency,
        categoryId,
        date,
        description: description.trim(),
        merchant: merchant.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        isRecurring,
      });
    }

    onClose();
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {transactionToEdit
              ? t('tx.modalTitleEdit', 'Edit Transaction')
              : t('tx.modalTitleNew', 'Record New Transaction')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Type Selector (Segmented) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const defaultExpenseCat = categories.find((c) => c.type === 'expense');
                if (defaultExpenseCat) setCategoryId(defaultExpenseCat.id);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('tx.typeExpense', 'Expense')}
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const defaultIncomeCat = categories.find((c) => c.type === 'income');
                if (defaultIncomeCat) setCategoryId(defaultIncomeCat.id);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('tx.typeIncome', 'Income')}
            </button>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('tx.amountLabel', 'Transaction Amount')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('tx.amountPlaceholder', '0.00')}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('tx.currencyLabel', 'Currency')}
              </label>
              <select
                value={txCurrency}
                onChange={(e) => setTxCurrency(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('tx.descLabel', 'Description')} *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tx.descPlaceholder', 'e.g. Monthly Grocery Restock')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('tx.categoryLabel', 'Category')} *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('tx.dateLabel', 'Transaction Date')} *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
              />
            </div>
          </div>

          {/* Merchant & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('tx.merchantLabel', 'Merchant / Payee')}
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder={t('tx.merchantPlaceholder', 'e.g. Safeway or Direct Deposit')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('tx.paymentMethodLabel', 'Payment Method')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer / CBE / Telebirr</option>
                <option value="Cash">Cash</option>
                <option value="Direct Deposit">Direct Deposit</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('tx.notesLabel', 'Notes & Memo (Optional)')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('tx.notesPlaceholder', 'Add any additional details or context...')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
            />
            <label htmlFor="isRecurring" className="text-xs text-slate-700 select-none cursor-pointer">
              {t('tx.recurringLabel', 'Mark as recurring transaction')}
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              {transactionToEdit ? t('common.save', 'Save Changes') : t('tx.newEntry', 'Record Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
