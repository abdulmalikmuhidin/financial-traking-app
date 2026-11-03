import React, { useState, useRef } from "react";
import {
  User,
  Coins,
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  Check,
  Globe,
  FileSpreadsheet,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFinance } from "@/context/FinanceContext";
import { useLanguage } from "@/context/LanguageContext";
import { SUPPORTED_CURRENCIES } from "@/utils/currencies";
import { EmailVerificationModal } from "@/components/features/auth/EmailVerificationModal";

export const SettingsPage: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    sendVerificationCode,
  } = useAuth();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const {
    currency,
    setCurrency,
    exportBackupJSON,
    importBackupJSON,
    exportTransactionsToCSV,
    clearAllUserData,
    requestConfirmation,
    showToast,
  } = useFinance();
  const { language, setLanguage, t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || "");
  const [incomeTarget, setIncomeTarget] = useState(
    currentUser?.monthlyIncomeTarget?.toString() || "6000",
  );
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
    showToast(
      t("set.savedSuccess", "Profile settings saved successfully"),
      "success",
    );
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
    e.target.value = "";
  };

  const handleClearAllConfirm = () => {
    requestConfirmation({
      title: t("set.clearAll", "Clear All Financial Records"),
      message: t(
        "set.clearConfirm",
        "Are you sure you want to delete all transaction and budget records? This cannot be undone.",
      ),
      confirmLabel: t("common.delete", "Clear Everything"),
      isDestructive: true,
      onConfirm: () => clearAllUserData(),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Title */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-base font-semibold text-slate-900">
          {t("set.title", "Account Settings & Preferences")}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t(
            "set.subtitle",
            "Manage your personal profile, language, preferred currency, and data backups.",
          )}
        </p>
      </div>

      {/* Profile Form */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t("set.profileInfo", "Profile Information")}
          </h3>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("set.fullName", "Full Name")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("set.jobTitle", "Professional / Account Title")}
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Freelancer, Engineer, Personal"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("set.email", "Email Address")}
              </label>
              <input
                type="email"
                required
                disabled
                value={email}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Your registered account email
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("set.incomeTarget", "Monthly Target Inflow / Baseline")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={incomeTarget}
                  onChange={(e) => setIncomeTarget(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-3 pr-12 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
                <span className="absolute right-3 top-2 text-xs font-mono font-bold text-slate-400">
                  {currency}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Target monthly benchmark for savings calculations
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>{t("set.saveChanges", "Save Changes")}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Verification & Security */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            Account Security & Verification
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {currentUser?.email}
                </span>
                {currentUser?.isEmailVerified ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100/70 border border-amber-300 rounded-full">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {currentUser?.isEmailVerified
                  ? "Your email address is verified and active for secure OTP passwordless logins and notifications."
                  : "Verify your email to enable one-time passwordless sign-ins and recovery notifications."}
              </p>
            </div>
          </div>

          {!currentUser?.isEmailVerified && (
            <button
              onClick={() => {
                sendVerificationCode();
                setIsVerifyModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              Verify Email Now
            </button>
          )}
        </div>
      </div>

      {/* Language Selection Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Globe className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t("set.language", "Language Selection (ቋንቋ)")}
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {t(
            "set.languageDesc",
            "Choose your preferred interface language. Changes take effect immediately across all pages.",
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <button
            type="button"
            onClick={() => {
              setLanguage("en");
              if (currency === "ETB") setCurrency("USD");
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              language === "en"
                ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                English (US)
              </span>
              {language === "en" && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Default application language
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage("am");
              if (currency === "USD") setCurrency("ETB");
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              language === "am"
                ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                አማርኛ (Amharic)
              </span>
              {language === "am" && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              የኢትዮጵያ የስራ ቋንቋ
            </span>
          </button>
        </div>
      </div>

      {/* Currency Preferences */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Coins className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t("set.currency", "Base Currency & Exchange Normalization")}
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {t(
            "set.currencyDesc",
            "FinTrack normalizes amounts into your chosen base currency using fixed reference conversion rates.",
          )}
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
                    ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                    : "border-slate-200 hover:border-slate-300 bg-white"
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

      {/* Data Portability & Management */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <FileSpreadsheet className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            {t("set.dataMgmt", "Data Portability & Management")}
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Export CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("set.exportCsv", "Export Transactions (CSV)")}
              </h4>
              <p className="text-slate-500 mt-0.5">
                Export clean spreadsheet format compatible with Excel, Google Sheets, or Apple Numbers.
              </p>
            </div>
            <button
              onClick={exportTransactionsToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("set.exportCsv", "Export CSV")}</span>
            </button>
          </div>

          {/* Export JSON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("set.exportJson", "Export Full Backup (JSON)")}
              </h4>
              <p className="text-slate-500 mt-0.5">
                Download a complete, portable backup file of your transactions, budgets, and categories.
              </p>
            </div>
            <button
              onClick={exportBackupJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("set.exportJson", "Export JSON")}</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("set.restoreJson", "Restore Backup (JSON)")}
              </h4>
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
                <span>{t("set.restoreJson", "Upload Backup")}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Clear Records */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-rose-900">
                  {t("set.clearAll", "Clear All Financial Records")}
                </h4>
                <p className="text-rose-700 mt-0.5 text-[11px]">
                  Permanently erase all your transaction and budget records from this account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearAllConfirm}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Records</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        emailToVerify={currentUser?.email}
      />
    </div>
  );
};
