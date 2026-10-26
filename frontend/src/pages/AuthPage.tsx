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
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_CURRENCIES } from '@/utils/currencies';

export type AuthMode = 'login' | 'register' | 'forgot' | 'otp';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToHome?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onBackToHome,
}) => {
  const { 
    login, 
    register, 
    requestPasswordReset, 
    submitPasswordReset, 
    sendOtpLogin, 
    verifyOtpLogin,
    latestNotice,
    loginAsDemo
  } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCurrency, setRegCurrency] = useState('USD');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Login form state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');

  // Messages & loading
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // 1. Password-based Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

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

  // 2. Account Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

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

  // 3. Forgot Password Request
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    const res = await requestPasswordReset(forgotEmail);
    setLoading(false);

    if (res.success) {
      setSuccess(t('auth.codeSentSuccess', 'Security code dispatched to your email!'));
      setForgotStep('reset');
      if (res.previewCode) {
        setResetCode(res.previewCode);
      }
    } else {
      setError(res.error || 'Failed to dispatch reset code.');
    }
  };

  // 4. Forgot Password Submit
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (resetCode.trim().length !== 6) {
      setError('Please enter a 6-digit recovery code.');
      return;
    }
    if (newPassword.length < 6) {
      setError(t('auth.shortPassword', 'Password must be at least 6 characters.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }

    setLoading(true);
    const res = await submitPasswordReset(forgotEmail, resetCode.trim(), newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess('Password updated successfully! Welcome back.');
    } else {
      setError(res.error || 'Password reset failed.');
    }
  };

  // 5. OTP Passwordless Login Request
  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!otpEmail || !otpEmail.includes('@')) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    setLoading(true);
    const res = await sendOtpLogin(otpEmail);
    setLoading(false);

    if (res.success) {
      setSuccess(t('auth.codeSentSuccess', 'Security code dispatched to your email!'));
      setOtpStep('verify');
      if (res.previewCode) {
        setOtpCode(res.previewCode);
      }
    } else {
      setError(res.error || 'Failed to send one-time login code.');
    }
  };

  // 6. OTP Passwordless Login Submit
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit one-time code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtpLogin(otpEmail, otpCode.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid login code.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-emerald-500/20">
      {/* Top Bar with Home & Language */}
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

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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

      {/* Auth Card Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-7 px-6 shadow-2xl rounded-2xl sm:px-9">
          {/* Main Segmented Toggle: Sign In vs Create Account */}
          {(mode === 'login' || mode === 'register') && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-lg mb-5 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearMessages();
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
                  clearMessages();
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
          )}

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 p-3 text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-800/80 rounded-lg flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 rounded-lg flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* MODE 1: Standard Password Sign In */}
          {mode === 'login' && (
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    {t('auth.passwordLabel', 'Password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotEmail(loginEmail);
                      clearMessages();
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {t('auth.forgotPassword', 'Forgot Password?')}
                  </button>
                </div>
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

              {/* Passwordless OTP Link */}
              <div className="pt-2 text-center border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setMode('otp');
                    setOtpEmail(loginEmail);
                    clearMessages();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{t('auth.emailOtpSignIn', 'Sign in with Email Code (OTP)')}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: Registration */}
          {mode === 'register' && (
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
            </form>
          )}

          {/* MODE 3: Forgot Password Recovery */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearMessages();
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('auth.resetPassword', 'Reset Password')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('auth.resetPasswordSub', 'Enter your registered email to receive a recovery code.')}
                  </p>
                </div>
              </div>

              {forgotStep === 'request' ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('auth.emailLabel', 'Email Address')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? t('auth.sendingCode', 'Sending Code...') : t('auth.sendResetCode', 'Send Reset Code')}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('auth.enterResetCode', 'Verification Code (6 digits)')}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="123456"
                      className="w-full text-center text-xl font-mono tracking-widest font-bold py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('auth.newPasswordLabel', 'New Password')}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('auth.confirmPasswordLabel', 'Confirm New Password')}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? t('auth.updatingPassword', 'Updating Password...') : t('auth.submitReset', 'Update Password & Enter')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Resend code with different email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 4: Passwordless OTP Sign In */}
          {mode === 'otp' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearMessages();
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('auth.emailOtpSignIn', 'Sign in with Email Code (OTP)')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('auth.emailOtpSignInSub', 'Fast passwordless sign-in through your email.')}
                  </p>
                </div>
              </div>

              {otpStep === 'request' ? (
                <form onSubmit={handleOtpRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('auth.emailLabel', 'Email Address')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? t('auth.sendingCode', 'Sending Code...') : t('auth.sendLoginCode', 'Send Login Code')}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('auth.enterResetCode', 'Verification Code (6 digits)')}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="123456"
                      autoFocus
                      className="w-full text-center text-xl font-mono tracking-widest font-bold py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? t('auth.signingIn', 'Signing In...') : t('auth.submitOtpSignIn', 'Verify & Sign In')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Resend code or change email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Feature Trust List */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div>
            <span className="block font-semibold text-slate-200">Email Verified</span>
            <span>OTP & Security Code</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-200">{t('auth.jwtBcrypt', 'JWT & Bcrypt')}</span>
            <span>Hashed credentials</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-200">{t('auth.mongoReady', 'MongoDB Ready')}</span>
            <span>Atlas & Fallback</span>
          </div>
        </div>
      </div>
    </div>
  );
};
