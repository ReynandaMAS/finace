import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TabKey } from '../../types/finance';
import {
  LayoutDashboard,
  ReceiptText,
  UsersRound,
  PiggyBank,
  HandCoins,
  FileSpreadsheet,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, accounts, hideBalances, currentUser, users } = useFinance();

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const navigationItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      key: 'overview',
      label: 'Ringkasan Harian',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      key: 'transactions',
      label: 'Buku Pengeluaran',
      icon: <ReceiptText className="w-4 h-4" />,
    },
    {
      key: 'users',
      label: 'Anggota & Hak Akses',
      icon: <UsersRound className="w-4 h-4" />,
      badge: `${users.length} User`,
    },
    {
      key: 'budgets',
      label: 'Anggaran Belanja',
      icon: <PiggyBank className="w-4 h-4" />,
    },
    {
      key: 'debts',
      label: 'Pinjaman & Talangan',
      icon: <HandCoins className="w-4 h-4" />,
    },
    {
      key: 'reports',
      label: 'Laporan Bulanan',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  const handleSelectTab = (key: TabKey) => {
    setActiveTab(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-10`}
      >
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-base">Menu Navigasi</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Menu Catatan
          </div>

          {navigationItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Dompet & Rekening Harian</span>
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="space-y-1.5 px-1">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs"
              >
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="font-medium truncate max-w-[130px]">{acc.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{acc.bankName}</span>
                </div>
                <div className="font-mono tabular-nums text-slate-200 font-semibold text-xs">
                  {formatRupiah(acc.currentBalance, hideBalances)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Total Liquidity Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="rounded-xl p-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Kas & Bank</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-bold text-white font-mono tabular-nums">
              {formatRupiah(totalBalance, hideBalances)}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[120px]">{currentUser?.name?.split(' ')[0]}</span>
              <span className="text-emerald-400 font-medium">{currentUser?.roleTitle}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
