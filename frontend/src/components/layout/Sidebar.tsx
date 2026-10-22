import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  BarChart3, 
  Tags, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Wallet
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNewTransaction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenNewTransaction,
}) => {
  const { currentUser, logout, loginAsDemo } = useAuth();
  const { t } = useLanguage();

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('nav.transactions', 'Transactions'), icon: ArrowLeftRight },
    { id: 'budgets', label: t('nav.budgets', 'Budgets'), icon: PieChart },
    { id: 'analytics', label: t('nav.analytics', 'Analytics & Reports'), icon: BarChart3 },
    { id: 'categories', label: t('nav.categories', 'Categories'), icon: Tags },
    { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-950 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out md:static ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                  FinTrack
                </span>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                  {t('app.tagline', 'Financial Intelligence')}
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-3">
          <button
            onClick={onOpenNewTransaction}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors whitespace-nowrap ${
              isCollapsed ? 'md:px-2' : ''
            }`}
            title="Log new transaction"
          >
            <span className="text-sm font-bold leading-none">+</span>
            {!isCollapsed && <span>{t('nav.addTransaction', 'Add Transaction')}</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Demo Switcher Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          {currentUser && (
            <div className={`flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-emerald-700/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                    {currentUser.isDemoUser && (
                      <span className="text-[10px] text-emerald-400/90 font-mono tracking-tight">DEMO</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              )}

              {!isCollapsed && (
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {!isCollapsed && currentUser?.isDemoUser && (
            <div className="mt-2.5 px-2 py-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{t('nav.demoMode', 'Demo Mode Active')}</span>
              <button
                onClick={loginAsDemo}
                className="text-emerald-400 hover:underline text-[10px] font-medium"
              >
                Reset Demo
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
