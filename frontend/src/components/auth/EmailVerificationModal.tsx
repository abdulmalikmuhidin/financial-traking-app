/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailToVerify?: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  emailToVerify,
}) => {
  const { currentUser, sendVerificationCode, verifyEmail, latestNotice } = useAuth();
  const { t } = useLanguage();

  const activeEmail = emailToVerify || currentUser?.email || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // If a notice with code for this email exists, pre-load or suggest
  const noticeCode = latestNotice && latestNotice.email.toLowerCase() === activeEmail.toLowerCase()
    ? latestNotice.code
    : undefined;

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError(t('auth.invalidCode', 'Please enter a valid 6-digit security code.'));
      return;
    }

    setLoading(true);
    const res = await verifyEmail(cleanCode, activeEmail);
    setLoading(false);

    if (res.success) {
      setSuccess(res.message || t('auth.emailVerified', 'Email Verified!'));
      setTimeout(() => {
        onClose();
        setCode('');
        setSuccess(null);
      }, 1800);
    } else {
      setError(res.error || t('common.error', 'Verification failed.'));
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setResending(true);

    const res = await sendVerificationCode(activeEmail);
    setResending(false);

    if (res.success) {
      setCooldown(60);
      setSuccess(t('auth.codeSentSuccess', 'Security code dispatched to your email!'));
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('auth.verifyModalTitle', 'Verify Your Email Address')}
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {activeEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t(
              'auth.verifyModalSub',
              'Confirm ownership of your email address to safeguard your financial ledger.'
            )}
          </p>

          {/* Development / simulated code helper banner */}
          {noticeCode && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {t('auth.codeReceived', 'Generated code:')} <strong>{noticeCode}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCode(noticeCode)}
                className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer"
              >
                {t('auth.quickFill', 'Auto-fill')}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('auth.enterResetCode', 'Verification Code (6 digits)')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full text-center text-2xl font-mono tracking-[0.4em] font-bold py-2.5 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">
                Didn&apos;t get a code?
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                <span>
                  {cooldown > 0
                    ? `${t('auth.resendCode', 'Resend Code')} (${cooldown}s)`
                    : t('auth.resendCode', 'Resend Code')}
                </span>
              </button>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || code.trim().length !== 6}
                className="w-2/3 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? t('auth.verifying', 'Verifying...') : t('auth.verifySubmit', 'Confirm & Verify')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
