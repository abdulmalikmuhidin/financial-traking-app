/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wallet,
  ArrowRight,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Coins,
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  Lock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface HomePageProps {
  onGoToAuth: (mode: 'login' | 'register') => void;
  onGoToDashboard?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onGoToAuth,
  onGoToDashboard,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, currentUser } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300 font-sans">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">
                FinTrack
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-emerald-400/90 font-mono">
                {language === 'am' ? 'የፋይናንስ ብልህነት' : 'Financial Intelligence'}
              </span>
            </div>
          </div>

          {/* Navigation Anchors (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a
              href="#features"
              className="hover:text-emerald-400 transition-colors"
            >
              {t('landing.navFeatures', 'Features')}
            </a>
            <a
              href="#benefits"
              className="hover:text-emerald-400 transition-colors"
            >
              {t('landing.navBenefits', 'Benefits')}
            </a>
            <a
              href="#security"
              className="hover:text-emerald-400 transition-colors"
            >
              {t('landing.navSecurity', 'Security')}
            </a>
          </nav>

          {/* Actions & Language Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title={language === 'en' ? 'Switch to Amharic (አማርኛ)' : 'Switch to English'}
              aria-label="Language selector"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={onGoToDashboard}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>{t('landing.goToDashboard', 'Dashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onGoToAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  {t('landing.login', 'Sign In')}
                </button>
                <button
                  onClick={() => onGoToAuth('register')}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span>{t('landing.register', 'Get Started')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Header */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {t('landing.heroBadge', 'Smart Personal Finance Platform')}
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {t('landing.heroTitle', 'Master Your Money with Clarity & Precision')}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {t('landing.heroSubtitle', 'FinTrack provides effortless expense tracking, real-time monthly budgeting, cash-flow analytics, and multi-currency normalization designed for your financial freedom.')}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onGoToAuth('register')}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('landing.ctaGetStarted', 'Create Free Account')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>{t('landing.ctaExplore', 'Explore Features')}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
            </div>

            {/* Quick Trust Highlights */}
            <div className="mt-12 pt-8 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">100%</p>
                <p className="text-xs text-slate-400 mt-1">{t('landing.statAccuracy', 'Real-Time Financial Flow')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-white">ETB • USD • EUR</p>
                <p className="text-xs text-slate-400 mt-1">{t('landing.statCurrencies', 'Multi-Currency Support')}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-white">Bcrypt + JWT</p>
                <p className="text-xs text-slate-400 mt-1">MongoDB & Enterprise Privacy</p>
              </div>
            </div>
          </div>

          {/* Interactive Hero Showcase Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {language === 'am' ? 'የጥቅምት ወር የፋይናንስ እንቅስቃሴ' : 'October 2026 Financial Rhythm'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'am' ? 'የቀጥታ ገቢ፣ ወጪ እና የተጣራ ቁጠባ' : 'Live Inflows, Outflows & Net Liquidity'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  ETB & USD Ready
                </span>
              </div>
            </div>

            {/* Metric preview grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  {t('dash.netBalance', 'Total Net Balance')}
                </span>
                <span className="text-2xl font-bold font-mono text-white">$14,240.00</span>
                <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs last month
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  {t('dash.inflows', 'October Inflows')}
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">$13,290.00</span>
                <span className="text-[11px] text-slate-400 mt-1 block">Salary, Consulting & Dividends</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  {t('dash.outflows', 'October Outflows')}
                </span>
                <span className="text-2xl font-bold font-mono text-rose-400">$3,666.69</span>
                <span className="text-[11px] text-slate-400 mt-1 block">8 Active Budget Limits</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {t('landing.featuresTitle', 'Engineered for Everyday Financial Control')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t('landing.featuresSub', 'Everything you need to track spending, monitor cash reserves, and stay ahead of your budget with zero complexity.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {t('landing.feat1Title', 'Real-Time Transaction Ledger')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('landing.feat1Desc', 'Categorize every inflow and outflow, attach merchants, log recurring subscriptions, and filter ledgers instantly.')}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {t('landing.feat2Title', 'Dynamic Monthly Budgets')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('landing.feat2Desc', 'Set spending boundaries per category with visual alerts at 80% and over-limit warnings to keep you disciplined.')}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {t('landing.feat3Title', 'Deep Analytics & Cash Flow')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('landing.feat3Desc', 'Visualize your income vs. expense rhythms, daily spending peaks, and track month-over-month savings rates.')}
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {t('landing.feat4Title', 'Ethiopian Birr & Multi-Currency')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('landing.feat4Desc', 'Native support for Ethiopian Birr (ETB / ብር) alongside USD ($), EUR (€), GBP (£), and automatic normalization.')}
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {t('landing.feat5Title', 'Full Data Portability')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('landing.feat5Desc', 'Export your entire ledger to clean CSV or complete JSON backup, and restore anytime with zero platform lock-in.')}
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div id="security" className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {t('landing.feat6Title', 'MongoDB & Cloud Persistence')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('landing.feat6Desc', 'Secure bcrypt encryption, JWT session management, and persistent storage with automatic offline fallback.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Benefits Section */}
      <section id="benefits" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {t('landing.benefitsTitle', 'Why Choose FinTrack?')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t('landing.benefitsSub', 'Built with clarity, privacy, and real-world utility at the core.')}
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  {t('landing.benefit1', 'Eliminate end-of-month budget surprises with clear visual tracking')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  {t('landing.benefit2', 'Native Ethiopian Birr support tailored for local and diaspora users')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  {t('landing.benefit3', 'Instant bilingual interface: seamlessly switch between English and Amharic')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  {t('landing.benefit4', '100% private financial records with zero advertising or tracking')}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => onGoToAuth('register')}
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>{t('landing.ctaGetStarted', 'Create Free Account')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">
              {language === 'am' ? 'የገንዘብ ቁጥጥር ፍልስፍና' : 'Financial Discipline System'}
            </h4>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-white">
                    {language === 'am' ? 'የምግብ እና የዕለት ወጪ' : 'Food & Dining'}
                  </span>
                  <span className="font-mono text-emerald-400">$385.90 / $750.00</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '51.4%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">51.4% used • On Track</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-white">
                    {language === 'am' ? 'ቤት እና ኪራይ' : 'Housing & Rent'}
                  </span>
                  <span className="font-mono text-amber-400">$2,150.00 / $2,200.00</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '97.7%' }} />
                </div>
                <span className="text-[10px] text-amber-400 mt-1 block">97.7% used • Near limit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call-to-Action Banner */}
      <section className="py-16 bg-gradient-to-b from-slate-950 to-emerald-950/30 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('landing.ctaBannerTitle', 'Ready to take control of your financial future?')}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            {t('landing.ctaBannerSub', 'Join FinTrack today. Set up your personalized workspace in seconds.')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onGoToAuth('register')}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('landing.ctaGetStarted', 'Create Free Account')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onGoToAuth('login')}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {t('landing.login', 'Sign In')}
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">FinTrack</span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-400">
              {t('landing.footerDesc', 'Empowering individuals with smart financial tracking, budgeting discipline, and actionable insights.')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{t('landing.footerCopyright', '© 2026 FinTrack. All rights reserved.')}</span>
            <button
              onClick={toggleLanguage}
              className="hover:text-emerald-400 transition-colors"
            >
              {language === 'en' ? 'አማርኛ' : 'English'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
