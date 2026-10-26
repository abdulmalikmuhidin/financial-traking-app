import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { NavigationTab, Transaction } from "./types";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import {
  HomePage,
  AuthPage,
  DashboardPage,
  TransactionsPage,
  BudgetsPage,
  AnalyticsPage,
  CategoriesPage,
  SettingsPage,
} from "./pages";
import { Mail } from "lucide-react";
import {
  TransactionModal,
  TransactionDetailModal,
} from "./components/features/transactions";
import { EmailVerificationModal } from "./components/features/auth";
import { ConfirmationModal } from "./components/common/ConfirmationModal";
import { ToastContainer } from "./components/common/ToastContainer";
import { SecurityNoticeBanner } from "./components/common/SecurityNoticeBanner";

const MainApp: React.FC = () => {
  const { currentUser, isAuthenticated, sendVerificationCode } = useAuth();
  const { t } = useLanguage();

  // Public visitor auth sub-route: null (shows HomePage), 'login', or 'register'
  const [authView, setAuthView] = useState<"login" | "register" | null>(null);

  // Navigation state for authenticated workspace
  const [currentTab, setCurrentTab] = useState<NavigationTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txToView, setTxToView] = useState<Transaction | null>(null);

  // If unauthenticated: show the professional Public Home Page by default, or the AuthPage if Login/Register is clicked
  if (!isAuthenticated) {
    if (authView === "login" || authView === "register") {
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

        {/* Email Verification Reminder Banner (when unverified and not demo) */}
        {!currentUser?.isEmailVerified && !currentUser?.isDemoUser && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-8 py-2.5 flex items-center justify-between text-xs text-amber-900 transition-colors">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {t(
                  "auth.verifyBannerText",
                  "Your email address is not verified yet. Verify it now to secure recovery options.",
                )}
              </span>
            </div>
            <button
              onClick={() => {
                sendVerificationCode();
                setIsEmailVerifyModalOpen(true);
              }}
              className="ml-3 font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer whitespace-nowrap"
            >
              {t("auth.verifyNow", "Verify Now")}
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenNewTransaction={handleOpenNewTransaction}
              onViewTransaction={handleViewTransaction}
            />
          )}

          {currentTab === "transactions" && (
            <TransactionsPage
              onOpenNewTransaction={handleOpenNewTransaction}
              onEditTransaction={handleEditTransaction}
              onViewTransaction={handleViewTransaction}
            />
          )}

          {currentTab === "budgets" && <BudgetsPage />}

          {currentTab === "analytics" && <AnalyticsPage />}

          {currentTab === "categories" && <CategoriesPage />}

          {currentTab === "settings" && <SettingsPage />}
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

      <EmailVerificationModal
        isOpen={isEmailVerifyModalOpen}
        onClose={() => setIsEmailVerifyModalOpen(false)}
        emailToVerify={currentUser?.email}
      />

      <ConfirmationModal />
      <ToastContainer />
      <SecurityNoticeBanner />
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
