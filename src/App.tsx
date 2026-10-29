import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { TransactionsTab } from './components/transactions/TransactionsTab';
import { UserManagementTab } from './components/users/UserManagementTab';
import { BudgetAndGoalsTab } from './components/budgets/BudgetAndGoalsTab';
import { DebtReceivableTab } from './components/debts/DebtReceivableTab';
import { ReportsTab } from './components/reports/ReportsTab';
import { TransactionModal } from './components/modals/TransactionModal';
import { DigitalReceiptModal } from './components/modals/DigitalReceiptModal';
import { AuthModal } from './components/auth/AuthModal';
import { Transaction } from './types/finance';

const MainLayout: React.FC = () => {
  const { activeTab, currentUser } = useFinance();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [receiptTransactionId, setReceiptTransactionId] = useState<string | null>(null);

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleOpenReceipt = (txId: string) => {
    setReceiptTransactionId(txId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Top Header */}
      <Header
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewTab
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenReceipt={handleOpenReceipt}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab
              onOpenNewTransaction={handleOpenNewTransaction}
              onEditTransaction={handleEditTransaction}
              onOpenReceipt={handleOpenReceipt}
            />
          )}

          {activeTab === 'users' && <UserManagementTab />}

          {activeTab === 'budgets' && <BudgetAndGoalsTab />}

          {activeTab === 'debts' && <DebtReceivableTab />}

          {activeTab === 'reports' && <ReportsTab />}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        editingTransaction={editingTransaction}
      />

      <DigitalReceiptModal
        transactionId={receiptTransactionId}
        onClose={() => setReceiptTransactionId(null)}
      />

      {/* Auth Screen shown if logged out */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
