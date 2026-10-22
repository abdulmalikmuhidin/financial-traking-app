import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';
import { renderCategoryIcon } from '../../utils/categoryIcons';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Cash',
  'Direct Deposit',
  'Electronic Transfer',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { categories, currency, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [txCurrency, setTxCurrency] = useState<string>(currency);
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Available categories based on selected type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setTxCurrency(transactionToEdit.currency);
      setCategoryId(transactionToEdit.categoryId);
      setDate(transactionToEdit.date);
      setDescription(transactionToEdit.description);
      setMerchant(transactionToEdit.merchant || '');
      setPaymentMethod(transactionToEdit.paymentMethod);
      setNotes(transactionToEdit.notes || '');
      setIsRecurring(!!transactionToEdit.isRecurring);
    } else {
      setType('expense');
      setAmount('');
      setTxCurrency(currency);
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setMerchant('');
      setPaymentMethod('Credit Card');
      setNotes('');
      setIsRecurring(false);
      setError(null);
    }
  }, [transactionToEdit, currency, isOpen]);

  // Set default category when type changes if current category doesn't match
  useEffect(() => {
    const currentValid = availableCategories.some((c) => c.id === categoryId);
    if (!currentValid && availableCategories.length > 0) {
      setCategoryId(availableCategories[0].id);
    }
  }, [type, availableCategories, categoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description or merchant for this record.');
      return;
    }

    if (!categoryId) {
      setError('Please choose a category.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
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
      addTransaction({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Type Selector (Segmented control) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                  type === 'expense'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                  type === 'income'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Income</span>
              </button>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono font-medium rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={txCurrency}
                  onChange={(e) => setTxCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description & Merchant */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Groceries or Client Project Milestone"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Merchant / Payer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Whole Foods, Spotify, Stripe"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>
            </div>

            {/* Category & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Additional details, tax deduction notes, or project reference"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 resize-none"
              />
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="isRecurring" className="text-xs text-slate-700 cursor-pointer select-none">
                Recurring monthly transaction
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              {transactionToEdit ? 'Save Changes' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
