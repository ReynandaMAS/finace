import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Eye,
  EyeOff,
  Plus,
  UserCheck,
  LogOut,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Building,
  Menu,
  Shield,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewTransaction, onOpenMobileSidebar }) => {
  const {
    currentUser,
    users,
    hideBalances,
    toggleHideBalances,
    quickSwitchUser,
    logout,
    resetAllData,
    activeTab,
    setActiveTab,
    hasPermission,
  } = useFinance();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Brand & Mobile Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Buka Menu"
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
              FinanKu
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                HARIAN
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('overview')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'text-white font-semibold' : ''
          }`}
        >
          Ringkasan Harian
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            activeTab === 'transactions' ? 'text-white font-semibold' : ''
          }`}
        >
          Buku Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'users' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          <span>Akses Anggota</span>
          <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded-full">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            activeTab === 'budgets' ? 'text-white font-semibold' : ''
          }`}
        >
          Anggaran Belanja
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            activeTab === 'reports' ? 'text-white font-semibold' : ''
          }`}
        >
          Laporan Arus Kas
        </button>
      </nav>

      {/* Zone 3: Actions & Current User Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Hide/Show Balance toggle */}
        <button
          onClick={toggleHideBalances}
          title={hideBalances ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo (Mode Privasi)'}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          {hideBalances ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Primary Action Button */}
        {hasPermission('canAddTransaction') && (
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-900/30 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Catat Transaksi</span>
            <span className="sm:hidden">Transaksi</span>
          </button>
        )}

        {/* User Profile & Quick Switch Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-left transition-colors border border-slate-800"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                  {currentUser?.name?.slice(0, 2).toUpperCase() || 'US'}
                </div>
              )}
            </div>

            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                {currentUser?.name || 'Tamu'}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono">
                {currentUser?.role === 'super_admin'
                  ? 'Utama'
                  : currentUser?.role === 'finance_admin'
                  ? 'Pasangan'
                  : currentUser?.role === 'finance_staff'
                  ? 'Anggota'
                  : 'Pengamat'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-700 flex items-center justify-center text-sm font-bold text-white">
                        {currentUser?.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                      <Shield className="w-2.5 h-2.5" />
                      {currentUser?.roleTitle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast Switch User Section */}
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
                  <span>Ganti Akun Anggota (Uji Akses)</span>
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </p>
                <div className="space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        quickSwitchUser(u.id);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        currentUser?.id === u.id
                          ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-slate-800 overflow-hidden shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-700 text-[9px] flex items-center justify-center text-white">
                              {u.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <span className="truncate">{u.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.role === 'super_admin' ? 'Kepala Keluarga' : u.role === 'finance_admin' ? 'Pasangan' : u.role === 'finance_staff' ? 'Anak' : 'Tamu'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-2 pt-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Kelola Akses Semua Pengguna</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Kembalikan semua data keuangan ke default demo?')) {
                      resetAllData();
                      setUserDropdownOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Data Demo</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
