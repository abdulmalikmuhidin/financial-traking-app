import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  Sparkles,
  Coins
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currencies';

export const AuthPage: React.FC = () => {
  const { login, register, loginAsDemo } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('alex.morgan@fintrack.app');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCurrency, setRegCurrency] = useState('USD');

  // Error & loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(loginEmail, loginPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register(regName, regEmail, regPassword, regCurrency);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-emerald-500/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 shadow-lg shadow-emerald-950/40">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          FinTrack
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Clarity, discipline, and intelligence for your personal finances.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Segmented Auth Mode Switch */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-lg mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
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
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In to Workspace'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* 1-Click Demo Shortcut */}
              <div className="pt-4 mt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Preview with Demo Account</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  Pre-configured with realistic transactions, budgets & analytics.
                </p>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="Jordan Vance"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="jordan@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preferred Currency
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
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : 'Create My Account'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Or jump straight in with the Demo Workspace →
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Feature Trust List */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div>
            <span className="block font-semibold text-slate-200">100% Private</span>
            <span>Client-side storage</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-200">No Pill Slop</span>
            <span>Clean typography</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-200">Strict Math</span>
            <span>Currency parity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
