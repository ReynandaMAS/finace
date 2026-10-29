import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  AlertTriangle,
  Receipt,
  UserPlus,
  Calendar,
  Building,
} from 'lucide-react';
import { formatRupiah, formatCompactRupiah, formatIndoDate } from '../../utils/formatters';
import { SalaryAllocationTracker } from './SalaryAllocationTracker';
import { DailyExpensesTracker } from './DailyExpensesTracker';

interface OverviewTabProps {
  onOpenNewTransaction: () => void;
  onOpenReceipt: (txId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenNewTransaction, onOpenReceipt }) => {
  const {
    accounts,
    transactions,
    categories,
    budgets,
    hideBalances,
    setActiveTab,
    currentUser,
    hasPermission,
  } = useFinance();

  const [timeFilter, setTimeFilter] = useState<'current_month' | 'all_time'>('current_month');
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);

  // Filter transactions for current month vs all
  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'all_time') return transactions;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [transactions, timeFilter]);

  // Aggregate metrics
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Monthly Chart Data (Last 6 Months)
  const chartData = useMemo(() => {
    const months = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
    // Realistic trend aligned with initial transactions
    return [
      { month: 'Mei', income: 42000000, expense: 28500000 },
      { month: 'Jun', income: 55000000, expense: 34000000 },
      { month: 'Jul', income: 48000000, expense: 31000000 },
      { month: 'Agu', income: 64000000, expense: 41000000 },
      { month: 'Sep', income: 58000000, expense: 38000000 },
      { month: 'Okt', income: totalIncome, expense: totalExpense },
    ];
  }, [totalIncome, totalExpense]);

  const maxChartVal = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    10000000
  );

  // Category breakdown for expenses
  const categoryExpenses = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      });

    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Lainnya',
          color: cat?.color || '#94A3B8',
          amount,
          percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, totalExpense]);

  // Budget warnings (categories that exceeded 75% of monthly budget)
  const budgetAlerts = useMemo(() => {
    return budgets
      .map((b) => {
        const cat = categories.find((c) => c.id === b.categoryId);
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);
        const ratio = (spent / b.limitAmount) * 100;
        return {
          categoryId: b.categoryId,
          categoryName: cat?.name || 'Kategori',
          limit: b.limitAmount,
          spent,
          ratio: Math.round(ratio),
        };
      })
      .filter((b) => b.ratio >= 75)
      .sort((a, b) => b.ratio - a.ratio);
  }, [budgets, categories, transactions]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Catatan Keuangan Sehari-hari</span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              Harian Aktif
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Halo, <span className="text-slate-200 font-semibold">{currentUser?.name}</span>. Pantau jajan, belanja dapur, tagihan rumah, dan tabungan Anda.
          </p>
        </div>

        {/* Filter Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setTimeFilter('current_month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              timeFilter === 'current_month'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulan Ini (Okt 2026)
          </button>
          <button
            onClick={() => setTimeFilter('all_time')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              timeFilter === 'all_time'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua Periode
          </button>
        </div>
      </div>

      {/* KPI 4-Card Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Simpanan & Dompet</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
            {formatRupiah(totalBalance, hideBalances)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Tersimpan di</span>
            <span className="text-slate-300 font-semibold">{accounts.length} dompet & rekening</span>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Pemasukan Bulan Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums tracking-tight">
            +{formatRupiah(totalIncome, hideBalances)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-500/90 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Gaji, freelance & sampingan ({filteredTransactions.filter((t) => t.type === 'income').length} kali)</span>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono tabular-nums tracking-tight">
            -{formatRupiah(totalExpense, hideBalances)}
          </div>
          <div className="mt-2 text-[11px] text-rose-500/90 flex items-center gap-1 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{filteredTransactions.filter((t) => t.type === 'expense').length} kali belanja & jajan</span>
          </div>
        </div>

        {/* Sisa Uang Bersih */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Sisa Uang (Surplus Tabungan)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
              netCashFlow >= 0 ? 'text-white' : 'text-amber-400'
            }`}
          >
            {formatRupiah(netCashFlow, hideBalances)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Uang yang tersimpan:</span>
            <span className="text-emerald-400 font-semibold font-mono">{savingsRate}% dari gaji</span>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">Catat Cepat:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('canAddTransaction') && (
            <button
              onClick={onOpenNewTransaction}
              className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+ Catat Belanja / Jajan / Gaji</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('users')}
            className="px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Akses Pasangan / Anak</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Batas Anggaran Dapur & Makan</span>
          </button>
        </div>
      </div>

      {/* Real-time Salary Deduction & Envelope Allocation Tracker */}
      <SalaryAllocationTracker onOpenNewTransaction={onOpenNewTransaction} />

      {/* Daily Expenses Input Frequency & Breakdown Tracker */}
      <DailyExpensesTracker
        onOpenNewTransaction={onOpenNewTransaction}
        onOpenReceipt={onOpenReceipt}
      />

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Cash Flow Trend Chart (2 Columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Tren Pengeluaran & Pemasukan 6 Bulan</h2>
              <p className="text-xs text-slate-400 mt-0.5">Perbandingan pola konsumsi harian dan tabungan</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-56 relative w-full flex items-end justify-between pt-6 px-2">
            {chartData.map((d, index) => {
              const incomeHeight = Math.round((d.income / maxChartVal) * 160);
              const expenseHeight = Math.round((d.expense / maxChartVal) * 160);
              const isHovered = chartHoverIndex === index;

              return (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setChartHoverIndex(index)}
                  onMouseLeave={() => setChartHoverIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-14 z-20 bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-xl text-center whitespace-nowrap pointer-events-none">
                      <p className="text-[10px] text-slate-400 font-semibold mb-0.5">{d.month} 2026</p>
                      <p className="text-xs text-emerald-400 font-mono font-bold">
                        Masuk: {formatRupiah(d.income, hideBalances)}
                      </p>
                      <p className="text-xs text-rose-400 font-mono font-bold">
                        Keluar: {formatRupiah(d.expense, hideBalances)}
                      </p>
                    </div>
                  )}

                  {/* Bars Side by Side */}
                  <div className="flex items-end gap-1.5 h-44 w-full justify-center">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(incomeHeight, 8)}px` }}
                      className={`w-4 sm:w-6 rounded-t-md transition-all duration-300 ${
                        isHovered ? 'bg-emerald-400 brightness-110 shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/80 hover:bg-emerald-400'
                      }`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(expenseHeight, 8)}px` }}
                      className={`w-4 sm:w-6 rounded-t-md transition-all duration-300 ${
                        isHovered ? 'bg-rose-400 brightness-110 shadow-lg shadow-rose-500/20' : 'bg-rose-500/80 hover:bg-rose-400'
                      }`}
                    />
                  </div>

                  <span className="mt-3 text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Rata-rata Pemasukan Bulanan: <strong className="text-slate-200 font-mono">Rp 52,5 Jt</strong></span>
            <span>Surplus Kumulatif: <strong className="text-emerald-400 font-mono">+Rp 84,2 Jt</strong></span>
          </div>
        </div>

        {/* Expense Category Breakdown (1 Column) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Distribusi Pengeluaran Sehari-hari</h2>
              <span className="text-[11px] font-mono text-slate-400">Okt 2026</span>
            </div>

            {/* Distribution bars */}
            <div className="space-y-3.5">
              {categoryExpenses.slice(0, 5).map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[150px]">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono tabular-nums">
                        {formatCompactRupiah(cat.amount)}
                      </span>
                      <span className="text-slate-200 font-mono font-semibold text-[11px] w-8 text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}

              {categoryExpenses.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  Belum ada data pengeluaran tercatat periode ini.
                </div>
              )}
            </div>
          </div>

          {/* Budget Warning Alert if any */}
          {budgetAlerts.length > 0 && (
            <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Peringatan Batas Belanja ({budgetAlerts.length})</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Kategori <strong className="text-white">{budgetAlerts[0].categoryName}</strong> sudah terpakai {budgetAlerts[0].ratio}% dari batas anggaran bulanan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Accounts List & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rekening Kas & Bank Cards */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Dompet & Tabungan Anda</h2>
            <span className="text-xs text-emerald-400 font-mono">{accounts.length} Akun</span>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {acc.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">{acc.accountNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[11px] text-slate-400">Saldo Dompet:</span>
                  <span className="font-mono tabular-nums font-bold text-slate-100">
                    {formatRupiah(acc.currentBalance, hideBalances)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions List (2 Columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Catatan Belanja & Pemasukan Terbaru</h2>
                <p className="text-xs text-slate-400">Aktivitas pengeluaran harian dan uang saku keluarga</p>
              </div>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {transactions.slice(0, 5).map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                const isIncome = t.type === 'income';
                const isExpense = t.type === 'expense';

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-850 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : isExpense
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : isExpense ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowLeftRight className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                          {t.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono">{formatIndoDate(t.date)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[120px]">{cat?.name || 'Umum'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500 font-mono text-[10px]">{t.createdByName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div
                          className={`text-xs font-bold font-mono tabular-nums ${
                            isIncome
                              ? 'text-emerald-400'
                              : isExpense
                              ? 'text-rose-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatRupiah(t.amount, hideBalances)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{t.referenceNumber}</span>
                      </div>

                      <button
                        onClick={() => onOpenReceipt(t.id)}
                        title="Lihat Struk / Bukti Transaksi"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {transactions.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
                  <p>Belum ada catatan transaksi tersimpan.</p>
                  <button
                    onClick={onOpenNewTransaction}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-block"
                  >
                    + Catat transaksi pertama Anda
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Status buku kas: <span className="text-emerald-400 font-medium">Tersinkronisasi & Seimbang</span></span>
            <span>Total Catatan: {transactions.length} baris</span>
          </div>
        </div>
      </div>
    </div>
  );
};
