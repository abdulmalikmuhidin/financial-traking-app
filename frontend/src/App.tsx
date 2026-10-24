/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NavigationTab, Transaction } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { TransactionDetailModal } from './components/transactions/TransactionDetailModal';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthPage } from './components/auth/AuthPage';
import { HomePage } from './components/home/HomePage';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Public visitor auth sub-route: null (shows HomePage), 'login', or 'register'
  const [authView, setAuthView] = useState<'login' | 'register' | null>(null);

  // Navigation state for authenticated workspace
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToView, setTxToView] = useState<Transaction | null>(null);

  // If unauthenticated: show the professional Public Home Page by default, or the AuthPage if Login/Register is clicked
  if (!isAuthenticated) {
    if (authView === 'login' || authView === 'register') {
      return (
        <AuthPage
          initialMode={authView}
          onBackToHome={() => setAuthView(null)}
        />
      );
    }

    return (
      <HomePage
        onGoToAuth={(mode) => setAuthView(mode)}
        onGoToDashboard={() => {}}
      />
    );
  }

  const handleOpenNewTransaction = () => {
    setTxToEdit(null);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsTxModalOpen(true);
  };

  const handleViewTransaction = (tx: Transaction) => {
    setTxToView(tx);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-emerald-500/20 selection:text-emerald-950">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenNewTransaction={handleOpenNewTransaction}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewTransaction={handleOpenNewTransaction}
          onNavigate={setCurrentTab}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenNewTransaction={handleOpenNewTransaction}
              onViewTransaction={handleViewTransaction}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              onOpenNewTransaction={handleOpenNewTransaction}
              onEditTransaction={handleEditTransaction}
              onViewTransaction={handleViewTransaction}
            />
          )}

          {currentTab === 'budgets' && <BudgetsView />}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'categories' && <CategoriesView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxToEdit(null);
        }}
        transactionToEdit={txToEdit}
      />

      <TransactionDetailModal
        transaction={txToView}
        onClose={() => setTxToView(null)}
        onEdit={handleEditTransaction}
      />

      <ConfirmationModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FinanceProvider>
          <MainApp />
        </FinanceProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
