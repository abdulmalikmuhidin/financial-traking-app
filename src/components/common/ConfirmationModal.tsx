import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmationModal: React.FC = () => {
  const { confirmation, closeConfirmation } = useFinance();

  if (!confirmation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${confirmation.isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">{confirmation.title}</h3>
          </div>
          <button
            onClick={closeConfirmation}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            {confirmation.message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={closeConfirmation}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {confirmation.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmation.onConfirm();
              closeConfirmation();
            }}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
              confirmation.isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {confirmation.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
