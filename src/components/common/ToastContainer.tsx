import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFinance();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderClass = 'border-slate-200 bg-white text-slate-800';
        let iconColor = 'text-slate-600';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderClass = 'border-emerald-200 bg-emerald-50/95 text-emerald-950 shadow-sm';
          iconColor = 'text-emerald-600';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-200 bg-rose-50/95 text-rose-950 shadow-sm';
          iconColor = 'text-rose-600';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderClass = 'border-amber-200 bg-amber-50/95 text-amber-950 shadow-sm';
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-sm font-medium shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <p className="flex-1 text-xs leading-relaxed">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
