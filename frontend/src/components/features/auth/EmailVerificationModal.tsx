import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

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

  const noticeCode = latestNotice && latestNotice.email.toLowerCase() === activeEmail.toLowerCase()
    ? latestNotice.code
    : undefined;

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setError(t('auth.sixDigitRequired', 'Please enter the 6-digit verification code.'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await verifyEmail(code, activeEmail);
    setLoading(false);

    if (res.success) {
      setSuccess(res.message || t('auth.emailVerifiedSuccess', 'Email verified successfully!'));
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(res.error || t('auth.verifyFailed', 'Invalid or expired verification code.'));
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError(null);
    setSuccess(null);

    const res = await sendVerificationCode(activeEmail);
    setResending(false);

    if (res.success) {
      setSuccess(t('auth.codeDispatched', 'A fresh 6-digit code was sent to your email.'));
      setCooldown(45);
    } else {
      setError(res.error || t('auth.resendFailed', 'Failed to dispatch code.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {t('auth.verifyEmailTitle', 'Verify Email Address')}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[220px]">
                {activeEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {t(
              'auth.verifyPrompt',
              'We sent a 6-digit security code to your email. Enter it below to verify your email address and unlock account recovery.'
            )}
          </p>

          {/* Sandbox Quick-Fill Notice */}
          {noticeCode && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-emerald-800 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {t('auth.sandboxCodeDetected', 'Development code')}: <strong className="font-mono text-sm tracking-widest">{noticeCode}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCode(noticeCode)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline ml-2 shrink-0"
              >
                {t('auth.autofill', 'Fill Code')}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              {t('auth.enterCode', '6-Digit Verification Code')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xl tracking-widest text-center text-slate-800 font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              {t('auth.didntReceive', "Didn't receive the code?")}
            </span>
            <button
              type="button"
              disabled={cooldown > 0 || resending}
              onClick={handleResend}
              className={`font-semibold transition-colors flex items-center space-x-1 ${
                cooldown > 0 || resending
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-emerald-600 hover:text-emerald-800 underline'
              }`}
            >
              {resending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('auth.sending', 'Sending...')}</span>
                </>
              ) : cooldown > 0 ? (
                <span>{t('auth.resendIn', 'Resend in')} {cooldown}s</span>
              ) : (
                <span>{t('auth.resendCode', 'Resend Code')}</span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? t('auth.verifying', 'Verifying...') : t('auth.confirmVerification', 'Confirm Verification')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
