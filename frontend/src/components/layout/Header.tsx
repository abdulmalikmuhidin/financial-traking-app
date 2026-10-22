import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Plus, 
  Coins, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Check,
  Globe,
  Download
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenMobileSidebar: () => void;
  onOpenNewTransaction: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenNewTransaction,
  onNavigate,
}) => {
  const { currentUser, logout, loginAsDemo } = useAuth();
  const { currency, setCurrency, exportTransactionsToCSV } = useFinance();
  const { language, setLanguage, t } = useLanguage();

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const TAB_TITLES: Record<NavigationTab, string> = {
    dashboard: t('nav.dashboard', 'Financial Overview'),
    transactions: t('nav.transactions', 'Transaction Ledger'),
    budgets: t('nav.budgets', 'Monthly Budgets'),
    analytics: t('nav.analytics', 'Analytics & Trends'),
    categories: t('nav.categories', 'Expense & Income Categories'),
    settings: t('nav.settings', 'Preferences & Data'),
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) {
        setLanguageDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200">
      {/* Zone 1: Mobile toggle & Breadcrumb Trail */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg md:hidden hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="font-semibold text-slate-400">FinTrack</span>
          <span className="text-slate-300" aria-hidden="true">/</span>
          <span className="font-semibold text-slate-900 truncate">
            {TAB_TITLES[currentTab]}
          </span>
        </div>
      </div>

      {/* Zone 2 & 3: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Switcher */}
        <div className="relative" ref={languageRef}>
          <button
            onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            title="Change language / ቋንቋ ቀይር"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">{language === 'am' ? 'አማርኛ' : 'EN'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {languageDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Language / ቋንቋ
              </div>
              <button
                onClick={() => {
                  setLanguage('en');
                  setLanguageDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  language === 'en' ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>English (US)</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
              <button
                onClick={() => {
                  setLanguage('am');
                  setLanguageDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  language === 'am' ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">አማርኛ (Amharic)</span>
                {language === 'am' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Currency Switcher */}
        <div className="relative" ref={currencyRef}>
          <button
            onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            title="Change display currency"
          >
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono">{currency}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {currencyDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Select Base Currency
              </div>
              {Object.values(SUPPORTED_CURRENCIES).map((cur) => {
                const isSelected = cur.code === currency;
                return (
                  <button
                    key={cur.code}
                    onClick={() => {
                      setCurrency(cur.code);
                      setCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                      isSelected ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono w-6 text-slate-500">{cur.symbol}</span>
                      <span>{cur.name} ({cur.code})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick CSV Export */}
        <button
          onClick={exportTransactionsToCSV}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          title="Export transactions as CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('nav.export', 'Export')}</span>
        </button>

        {/* Add Transaction Primary CTA */}
        <button
          onClick={onOpenNewTransaction}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">{t('nav.addEntry', 'Add Entry')}</span>
          <span className="sm:hidden">{t('nav.addEntry', 'Add')}</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 pl-2 focus:outline-hidden"
            aria-label="User account menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center border border-slate-700 shadow-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                {currentUser?.isDemoUser && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Demo Account Active</p>
                )}
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('nav.settings', 'Settings')}</span>
                </button>

                {currentUser?.isDemoUser && (
                  <button
                    onClick={() => {
                      loginAsDemo();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Reset Demo Data</span>
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 text-left transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('nav.logout', 'Log out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
