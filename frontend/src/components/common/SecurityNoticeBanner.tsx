/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, Check, X, Sparkles, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const SecurityNoticeBanner: React.FC = () => {
  const { latestNotice, dismissNotice } = useAuth();
  const { t } = useLanguage();
  const [copied, setCopied] = React.useState(false);

  if (!latestNotice || !latestNotice.code) return null;

  const copyCode = () => {
    if (latestNotice?.code) {
      navigator.clipboard.writeText(latestNotice.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTitle = () => {
    switch (latestNotice.type) {
      case 'verification':
        return t('auth.verifyModalTitle', 'Email Verification Code');
      case 'reset':
        return t('auth.resetPassword', 'Password Reset Code');
      case 'otp':
        return t('auth.emailOtpSignIn', 'One-Time Login Code');
      default:
        return 'Security Code';
    }
  };

  return (
    <aside
      aria-label="Security verification code notification"
      className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900/95 text-white border border-emerald-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Mail className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {getTitle()}
          </span>
        </div>
        <button
          onClick={dismissNotice}
          className="text-slate-400 hover:text-white transition-colors p-0.5"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2 text-xs text-slate-300">
        <span>Sent to </span>
        <strong className="text-slate-100">{latestNotice.email}</strong>:
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
        <span className="font-mono text-xl font-bold tracking-widest text-emerald-400 px-2">
          {latestNotice.code}
        </span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-slate-950" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
        <span>Valid for 15 minutes. Use directly in the verification input.</span>
      </div>
    </aside>
  );
};
