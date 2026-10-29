import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Banknote,
  PiggyBank,
  Utensils,
  ShoppingCart,
  Car,
  Zap,
  Coffee,
  HeartPulse,
  Edit3,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { formatRupiah, formatCompactRupiah } from '../../utils/formatters';

export const SalaryAllocationTracker: React.FC<{ onOpenNewTransaction: () => void }> = ({
  onOpenNewTransaction,
}) => {
  const {
    salaryConfig,
    updateSalaryConfig,
    updateEnvelopeAllocation,
    transactions,
    hideBalances,
    categories,
    hasPermission,
  } = useFinance();

  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');
  const [editingEnvelopeId, setEditingEnvelopeId] = useState<string | null>(null);
  const [envelopeAmountInput, setEnvelopeAmountInput] = useState('');

  // Get current month transactions
  const now = new Date();
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [transactions, now]);

  // Total realtime expense this month
  const totalExpenseThisMonth = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  // Realtime remaining salary
  const remainingSalary = salaryConfig.monthlySalary - totalExpenseThisMonth;
  const spentPercentage = Math.min(
    100,
    salaryConfig.monthlySalary > 0
      ? Math.round((totalExpenseThisMonth / salaryConfig.monthlySalary) * 100)
      : 0
  );

  // Calculate realtime spending for each envelope
  const envelopesWithRealtimeData = useMemo(() => {
    return salaryConfig.envelopes.map((env) => {
      // Find all expenses matching categories of this envelope
      const matchingExpenses = currentMonthTransactions.filter(
        (t) => t.type === 'expense' && env.categoryIds.includes(t.categoryId)
      );

      // If envelope is marked as savings, also count transfers to savings/investment accounts
      const matchingSavingsTransfers = env.isSavings
        ? currentMonthTransactions.filter(
            (t) => t.type === 'transfer' && t.targetAccountId === 'acc_tabungan'
          )
        : [];

      const totalSpentOrSaved = env.isSavings
        ? matchingSavingsTransfers.reduce((sum, t) => sum + t.amount, 0)
        : matchingExpenses.reduce((sum, t) => sum + t.amount, 0);

      const inputCount = env.isSavings
        ? matchingSavingsTransfers.length
        : matchingExpenses.length;

      const remainingQuota = Math.max(0, env.allocatedAmount - totalSpentOrSaved);
      const isOver = !env.isSavings && totalSpentOrSaved > env.allocatedAmount;
      const progress =
        env.allocatedAmount > 0
          ? Math.min(100, Math.round((totalSpentOrSaved / env.allocatedAmount) * 100))
          : 0;

      return {
        ...env,
        totalSpentOrSaved,
        remainingQuota,
        inputCount,
        progress,
        isOver,
      };
    });
  }, [salaryConfig.envelopes, currentMonthTransactions]);

  // Total allocated across all envelopes
  const totalAllocated = salaryConfig.envelopes.reduce((sum, e) => sum + e.allocatedAmount, 0);
  const unallocatedSalary = salaryConfig.monthlySalary - totalAllocated;

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(salaryInput.replace(/[^0-9]/g, '')) || 0;
    if (val > 0) {
      updateSalaryConfig({ monthlySalary: val });
    }
    setIsEditingSalary(false);
  };

  const handleSaveEnvelope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnvelopeId) return;
    const val = parseFloat(envelopeAmountInput.replace(/[^0-9]/g, '')) || 0;
    updateEnvelopeAllocation(editingEnvelopeId, val);
    setEditingEnvelopeId(null);
  };

  const getEnvelopeIcon = (iconName: string) => {
    switch (iconName) {
      case 'PiggyBank':
        return <PiggyBank className="w-4 h-4" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-4 h-4" />;
      case 'Car':
        return <Car className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Realtime Salary Deduction Monitor Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Banknote className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white">
                Monitor Pengurangan Gaji Real-time
              </h2>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/60 font-mono">
                Live Sinkron
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Setiap kali Anda mencatat pengeluaran harian, saldo gaji pokok akan berkurang secara otomatis detik ini juga.
            </p>
          </div>

          <button
            onClick={() => {
              setSalaryInput(salaryConfig.monthlySalary.toString());
              setIsEditingSalary(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start md:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Atur Nominal Gaji</span>
          </button>
        </div>

        {/* 3 Live Metric Strips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {/* Gaji Pokok */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">1. Gaji Pokok Bulanan:</span>
            <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
              {formatRupiah(salaryConfig.monthlySalary, hideBalances)}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Penerimaan tanggal {salaryConfig.paydayDate} tiap bulan
            </span>
          </div>

          {/* Total Pengeluaran Realtime */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>2. Total Pengeluaran Terpakai:</span>
              <span className="text-rose-400 font-mono font-bold">-{spentPercentage}%</span>
            </div>
            <div className="text-xl font-bold text-rose-400 font-mono tabular-nums mt-1">
              -{formatRupiah(totalExpenseThisMonth, hideBalances)}
            </div>
            <span className="text-[10px] text-rose-400/80 mt-0.5 block font-mono">
              Dari {currentMonthTransactions.filter((t) => t.type === 'expense').length} kali input pengeluaran
            </span>
          </div>

          {/* Sisa Gaji Bersih Realtime */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40 bg-emerald-950/10">
            <span className="text-[11px] text-emerald-300 font-medium">3. Sisa Gaji Realtime Saat Ini:</span>
            <div
              className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                remainingSalary >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {formatRupiah(remainingSalary, hideBalances)}
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block font-mono">
              Sisa {100 - spentPercentage}% dana gaji yang belum terpakai
            </span>
          </div>
        </div>

        {/* Global Salary Progress Meter */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Kapasitas Pemakaian Gaji:</span>
              <strong className="text-white font-mono">{spentPercentage}% Terpakai</strong>
            </span>
            <span className="text-xs font-mono text-emerald-400">
              Sisa Kuota: {formatRupiah(remainingSalary, hideBalances)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spentPercentage >= 90
                  ? 'bg-rose-500'
                  : spentPercentage >= 70
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${spentPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* POS-POS ALOKASI GAJI (METODE AMPLOP DIGITAL) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Pos Alokasi Gaji (Setiap Pengeluaran Langsung Memotong Posnya)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gaji otomatis dipisah ke pos tabungan, pos makan, belanja dapur, transport, tagihan, dan jajan.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            <span>Dana Belum Dialokasikan: </span>
            <strong className="text-emerald-400 font-bold">
              {formatRupiah(unallocatedSalary, hideBalances)}
            </strong>
          </div>
        </div>

        {/* Envelopes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {envelopesWithRealtimeData.map((env) => (
            <div
              key={env.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: `${env.color}25`, color: env.color }}
                    >
                      {getEnvelopeIcon(env.icon)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{env.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {env.inputCount} transaksi memotong pos ini
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingEnvelopeId(env.id);
                      setEnvelopeAmountInput(env.allocatedAmount.toString());
                    }}
                    title="Ubah Jatah Alokasi Pos"
                    className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors opacity-70 group-hover:opacity-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Amount Figures */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      {env.isSavings ? 'Sudah Ditabung:' : 'Terpakai:'}
                    </span>
                    <span
                      className={`font-bold ${
                        env.isSavings
                          ? 'text-emerald-400'
                          : env.isOver
                          ? 'text-rose-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {formatRupiah(env.totalSpentOrSaved, hideBalances)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Jatah Pos Gaji:</span>
                    <span>{formatRupiah(env.allocatedAmount, hideBalances)}</span>
                  </div>
                </div>

                {/* Meter */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${env.progress}%`,
                      backgroundColor: env.isOver ? '#EF4444' : env.color,
                    }}
                  />
                </div>
              </div>

              {/* Status Footer */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {env.isSavings ? 'Target Alokasi:' : 'Sisa Kuota Pos:'}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    env.isSavings
                      ? 'text-emerald-400'
                      : env.isOver
                      ? 'text-rose-400'
                      : 'text-emerald-300'
                  }`}
                >
                  {env.isSavings
                    ? `${env.progress}% Terkumpul`
                    : env.isOver
                    ? `Overbudget ${formatRupiah(env.totalSpentOrSaved - env.allocatedAmount, hideBalances)}`
                    : formatRupiah(env.remainingQuota, hideBalances)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Edit Gaji Pokok */}
      {isEditingSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Ubah Gaji Pokok Bulanan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Nominal gaji ini menjadi dasar kalkulasi sisa dana dan alokasi pos harian.
            </p>

            <form onSubmit={handleSaveSalary} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Gaji Baru (IDR)
                </label>
                <input
                  type="text"
                  required
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] font-mono text-emerald-400 mt-1">
                  Preview: {formatRupiah(parseFloat(salaryInput) || 0)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSalary(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  Simpan Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Alokasi Pos */}
      {editingEnvelopeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Ubah Jatah Pos Gaji</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tentukan berapa rupiah gaji yang dipisahkan untuk pos ini tiap bulan.
            </p>

            <form onSubmit={handleSaveEnvelope} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alokasi Dana Pos (IDR)
                </label>
                <input
                  type="text"
                  required
                  value={envelopeAmountInput}
                  onChange={(e) => setEnvelopeAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] font-mono text-emerald-400 mt-1">
                  Preview: {formatRupiah(parseFloat(envelopeAmountInput) || 0)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEnvelopeId(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  Simpan Pos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
