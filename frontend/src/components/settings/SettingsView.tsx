/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  User, 
  Coins, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  Globe, 
  FileSpreadsheet, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';
import { EmailVerificationModal } from '../auth/EmailVerificationModal';

export const SettingsView: React.FC = () => {
  const { currentUser, updateProfile, dbStatus, checkDbStatus, sendVerificationCode } = useAuth();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const { 
    currency, 
    setCurrency, 
    exportBackupJSON, 
    importBackupJSON, 
    exportTransactionsToCSV,
    clearAllUserData,
    requestConfirmation,
    showToast 
  } = useFinance();
  const { language, setLanguage, t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [incomeTarget, setIncomeTarget] = useState(currentUser?.monthlyIncomeTarget?.toString() || '6000');
  const [isSaved, setIsSaved] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      jobTitle: jobTitle.trim(),
      monthlyIncomeTarget: parseFloat(incomeTarget) || 5000,
    });
    setIsSaved(true);
    showToast(t('set.savedSuccess', 'Profile settings saved successfully'), 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAllConfirm = () => {
    requestConfirmation({
      title: t('set.clearAll', 'Clear All Financial Records'),
      message: t('set.clearConfirm', 'Are you sure you want to delete all transaction and budget records? This cannot be undone.'),
      confirmLabel: t('common.delete', 'Clear Everything'),
      isDestructive: true,
      onConfirm: () => clearAllUserData(),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Title */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-base font-semibold text-slate-900">
          {t('set.title', 'Account Settings & Preferences')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('set.subtitle', 'Manage your personal profile, language, preferred currency, and database connection.')}
        </p>
      </div>

      {/* Language Selection Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Globe className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t('set.language', 'Language Selection (ቋንቋ)')}
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {t('set.languageDesc', 'Choose your preferred interface language. Changes take effect immediately across all pages.')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              language === 'en'
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">English (US)</span>
              {language === 'en' && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Default application language
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage('am')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              language === 'am'
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">አማርኛ (Amharic)</span>
              {language === 'am' && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              የኢትዮጵያ የስራ ቋንቋ
            </span>
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t('set.profileInfo', 'Profile Information')}
          </h3>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('set.fullName', 'Full Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  {t('set.email', 'Email Address')}
                </label>
                {currentUser?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>{t('auth.verifiedBadge', 'Verified')}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sendVerificationCode();
                      setIsVerifyModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                  >
                    <span>{t('auth.verifyNow', 'Verify Now')}</span>
                  </button>
                )}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('set.jobTitle', 'Professional Title')}
              </label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Designer, Freelancer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('set.incomeTarget', 'Monthly Target Inflow / Baseline')} ({currency})
              </label>
              <input
                type="number"
                step="100"
                value={incomeTarget}
                onChange={(e) => setIncomeTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{isSaved ? t('set.savedSuccess', 'Saved Successfully') : t('set.saveChanges', 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Currency Preference */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Coins className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t('set.currency', 'Base Currency & Exchange Normalization')}
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {t('set.currencyDesc', 'FinTrack normalizes amounts into your chosen base currency using fixed reference conversion rates.')}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(SUPPORTED_CURRENCIES).map((cur) => {
            const isSelected = cur.code === currency;
            return (
              <button
                key={cur.code}
                onClick={() => setCurrency(cur.code)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {cur.symbol} {cur.code}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {cur.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  1 USD = {cur.rateToUSD} {cur.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MongoDB Database Configuration */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              {t('set.mongoTitle', 'MongoDB Database Connection')}
            </h3>
          </div>
          <button
            onClick={() => checkDbStatus()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-medium cursor-pointer"
            title="Refresh database connection status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('set.checkStatus', 'Check Status')}</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`p-4 rounded-lg border text-xs mb-4 ${
          dbStatus.isConnected 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${
              dbStatus.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
            <div>
              <p className="font-semibold text-xs">
                {dbStatus.isConnected
                  ? `${t('set.connected', 'Connected to MongoDB')} (${dbStatus.databaseName || 'fintrack'})`
                  : t('set.disconnected', 'Offline Fallback Store Active')}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                {dbStatus.isConnected
                  ? 'Your user accounts, transactions, and budgets are securely persisted in your MongoDB database.'
                  : 'Operating in client-resilient mode. Update your MONGODB_URI in .env to connect your cloud cluster.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Backups */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t('set.dataMgmt', 'Data Portability & Management')}
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Export JSON & CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">{t('set.exportJson', 'Export Full Backup (JSON)')}</h4>
              <p className="text-slate-500 mt-0.5">
                Download all your transactions, budgets, categories, and settings as a JSON file.
              </p>
            </div>
            <button
              onClick={exportBackupJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('set.exportJson', 'Export JSON')}</span>
            </button>
          </div>

          {/* Export CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">{t('set.exportCsv', 'Export Transactions (CSV)')}</h4>
              <p className="text-slate-500 mt-0.5">
                Export clean CSV format compatible with Excel, Google Sheets, or Apple Numbers.
              </p>
            </div>
            <button
              onClick={exportTransactionsToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('set.exportCsv', 'Export CSV')}</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">{t('set.restoreJson', 'Restore Backup (JSON)')}</h4>
              <p className="text-slate-500 mt-0.5">
                Upload a previous FinTrack backup file to restore records.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportJSON}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('set.restoreJson', 'Upload JSON')}</span>
              </button>
            </div>
          </div>

          {/* Purge All Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50/60 rounded-lg border border-rose-200">
            <div>
              <h4 className="font-semibold text-rose-950">{t('set.clearAll', 'Clear All Financial Records')}</h4>
              <p className="text-rose-800 text-[11px] mt-0.5">
                Permanently purge all transactions and budget thresholds from this browser session.
              </p>
            </div>
            <button
              onClick={handleClearAllConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{t('set.clearAll', 'Clear Everything')}</span>
            </button>
          </div>
        </div>
      </div>

      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        emailToVerify={currentUser?.email}
      />
    </div>
  );
};
