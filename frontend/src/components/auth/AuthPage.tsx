/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowRight, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Coins,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToHome?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onBackToHome,
}) => {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCurrency, setRegCurrency] = useState('USD');

  // Error & loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail || !loginEmail.includes('@')) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setError(t('auth.shortPassword', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);
    const res = await login(loginEmail, loginPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || t('auth.loginFailed', 'Login failed. Please check credentials.'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError(t('auth.nameRequired', 'Please enter your full name.'));
      return;
    }
    if (!regEmail || !regEmail.includes('@')) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError(t('auth.shortPassword', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);
    const res = await register(regName, regEmail, regPassword, regCurrency);
    setLoading(false);

    if (!res.success) {
      setError(res.error || t('auth.registerFailed', 'Registration failed.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-emerald-500/20">
      {/* Top Navigation Row */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex items-center justify-between mb-4">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth.backToHome', '← Back to Home')}</span>
          </button>
        )}
        <button
          onClick={toggleLanguage}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Change language / ቋንቋ ቀይር"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 shadow-lg shadow-emerald-950/40">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          FinTrack
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {t('app.subtitle', 'Clarity, discipline, and intelligence for your personal finances.')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Segmented Auth Mode Switch */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-lg mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.signIn', 'Sign In')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.createAccount', 'Create Account')}
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-800/80 rounded-lg animate-in fade-in">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.emailLabel', 'Email Address')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.passwordLabel', 'Password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? t('auth.signingIn', 'Signing In...') : t('auth.submitSignIn', 'Sign In to Workspace')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t('auth.needAccount', "Don't have an account? Create Account")}
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.nameLabel', 'Full Name')}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder={t('auth.namePlaceholder', 'e.g. Alex Morgan')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.emailLabel', 'Email Address')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.passwordLabel', 'Password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder={t('auth.passwordPlaceholder', 'Minimum 6 characters')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.preferredCurrency', 'Preferred Base Currency')}
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <select
                    value={regCurrency}
                    onChange={(e) => setRegCurrency(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900">
                        {c.code} ({c.symbol}) - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? t('auth.creatingAccount', 'Creating Account...') : t('auth.submitRegister', 'Create My Account')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t('auth.haveAccount', 'Already have an account? Sign In')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Feature Trust List */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div>
            <span className="block font-semibold text-slate-200">{t('auth.mongoReady', 'MongoDB Ready')}</span>
            <span>Atlas & Local driver</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-200">{t('auth.jwtBcrypt', 'JWT & Bcrypt')}</span>
            <span>Hashed credentials</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-200">{t('auth.fullStack', 'Full-Stack')}</span>
            <span>REST API backend</span>
          </div>
        </div>
      </div>
    </div>
  );
};
