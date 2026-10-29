import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  ArrowDownRight,
  Receipt,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag,
  Flame,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { formatRupiah, formatCompactRupiah, formatIndoDate } from '../../utils/formatters';

interface DailyExpensesTrackerProps {
  onOpenNewTransaction: () => void;
  onOpenReceipt: (txId: string) => void;
}

export const DailyExpensesTracker: React.FC<DailyExpensesTrackerProps> = ({
  onOpenNewTransaction,
  onOpenReceipt,
}) => {
  const { transactions, categories, hideBalances, salaryConfig, hasPermission } = useFinance();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Group all expense transactions by date
  const groupedByDate = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');
    const groups = new Map<
      string,
      {
        date: string;
        total: number;
        items: typeof expenseTx;
      }
    >();

    expenseTx.forEach((tx) => {
      const dateKey = tx.date.split('T')[0];
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: dateKey,
          total: 0,
          items: [],
        });
      }
      const g = groups.get(dateKey)!;
      g.total += tx.amount;
      g.items.push(tx);
    });

    // Sort dates descending
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions]);

  // Today's summary
  const todayGroup = groupedByDate.find((g) => g.date === todayStr);
  const todayItems = todayGroup?.items || [];
  const todayTotal = todayGroup?.total || 0;
  const todayCount = todayItems.length;

  // Previous days (excluding today)
  const previousDays = groupedByDate.filter((g) => g.date !== todayStr);

  // Analytics for daily habits
  const dailyStats = useMemo(() => {
    if (groupedByDate.length === 0) {
      return { avgPerDay: 0, avgInputsPerDay: 0, maxDay: null, minDay: null };
    }
    const totalSpent = groupedByDate.reduce((sum, g) => sum + g.total, 0);
    const totalInputs = groupedByDate.reduce((sum, g) => sum + g.items.length, 0);
    const avgPerDay = Math.round(totalSpent / groupedByDate.length);
    const avgInputsPerDay = (totalInputs / groupedByDate.length).toFixed(1);

    // Max day
    const sortedByTotal = [...groupedByDate].sort((a, b) => b.total - a.total);
    const maxDay = sortedByTotal[0];
    const minDay = sortedByTotal[sortedByTotal.length - 1];

    return { avgPerDay, avgInputsPerDay, maxDay, minDay };
  }, [groupedByDate]);

  // Helper to find which envelope is hit by this category
  const getEnvelopeForCategory = (catId: string) => {
    return salaryConfig.envelopes.find((env) => env.categoryIds.includes(catId));
  };

  const getDayLabel = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hari Ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays === 2) return '2 Hari Lalu';

    return formatIndoDate(dateStr);
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick stats */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white">
                Rekap Inputan Pengeluaran Sehari-hari
              </h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {dailyStats.avgInputsPerDay} inputan/hari
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Catat setiap uang keluar harian (3-4 kali sehari seperti makan siang, jajan kopi, bensin, atau beli cemilan).
            </p>
          </div>

          {hasPermission('canAddTransaction') && (
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Input Pengeluaran Baru</span>
            </button>
          )}
        </div>

        {/* 3 Quick Daily Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Rata-rata Pengeluaran:</span>
            <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
              {formatRupiah(dailyStats.avgPerDay, hideBalances)} / hari
            </div>
            <span className="text-[10px] text-slate-500">Berdasarkan total hari aktif</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Frekuensi Pencatatan:</span>
            <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
              {dailyStats.avgInputsPerDay} Kali Sehari
            </div>
            <span className="text-[10px] text-slate-500">Makan, transport, jajan & belanja</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Pengeluaran Tertinggi (1 Hari):</span>
            <div className="text-lg font-bold text-rose-400 font-mono tabular-nums mt-0.5">
              {dailyStats.maxDay ? formatRupiah(dailyStats.maxDay.total, hideBalances) : 'Rp 0'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {dailyStats.maxDay ? formatIndoDate(dailyStats.maxDay.date) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* TODAY'S SPOTLIGHT CARD */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-rose-900/30 shadow-lg relative overflow-hidden">
        {/* Top Tag & Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Pengeluaran Hari Ini</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {todayCount} Inputan Tercatat
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {formatIndoDate(todayStr)}
              </p>
            </div>
          </div>

          {/* Today's Total */}
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400">Total Pengeluaran Hari Ini:</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 tabular-nums">
              -{formatRupiah(todayTotal, hideBalances)}
            </div>
          </div>
        </div>

        {/* List of Today's Inputs */}
        {todayItems.length > 0 ? (
          <div className="space-y-2 pt-1">
            {todayItems.map((item, idx) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const env = getEnvelopeForCategory(item.categoryId);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
                          {item.description}
                        </p>
                        {item.time && (
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${cat?.color || '#64748B'}15`,
                            color: cat?.color || '#94A3B8',
                          }}
                        >
                          {cat?.name || 'Lainnya'}
                        </span>
                        {env && (
                          <span className="text-[10px] text-emerald-400/90 font-mono">
                            &rarr; Potong [{env.name}]
                          </span>
                        )}
                        <span className="text-slate-500 text-[10px]">
                          ({item.createdByName})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs sm:text-sm font-bold font-mono text-rose-400 tabular-nums">
                      -{formatRupiah(item.amount, hideBalances)}
                    </span>
                    <button
                      onClick={() => onOpenReceipt(item.id)}
                      title="Lihat Struk Digital"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
            <p className="text-xs text-slate-400">
              Belum ada inputan pengeluaran untuk hari ini.
            </p>
            <button
              onClick={onOpenNewTransaction}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              + Catat pengeluaran pertama hari ini
            </button>
          </div>
        )}
      </div>

      {/* PREVIOUS DAYS LIST (ACCORDION) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Riwayat Hari-Hari Sebelumnya
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {previousDays.length} hari tercatat
          </span>
        </div>

        <div className="space-y-2">
          {previousDays.map((group) => {
            const isExpanded = expandedDate === group.date;
            const dayLabel = getDayLabel(group.date);

            return (
              <div
                key={group.date}
                className="rounded-xl bg-slate-950/40 border border-slate-800/80 overflow-hidden transition-all"
              >
                {/* Accordion Trigger */}
                <button
                  onClick={() => setExpandedDate(isExpanded ? null : group.date)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-200">
                      {dayLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatIndoDate(group.date)}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {group.items.length} inputan
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-rose-400 tabular-nums">
                      -{formatRupiah(group.total, hideBalances)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-slate-800/60 space-y-1.5 bg-slate-950/60">
                    {group.items.map((item, idx) => {
                      const cat = categories.find((c) => c.id === item.categoryId);
                      const env = getEnvelopeForCategory(item.categoryId);

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-slate-500 w-4">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-slate-200 font-medium truncate">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span>{cat?.name || 'Umum'}</span>
                                {env && <span>&bull; Pos: {env.name}</span>}
                                {item.time && <span>&bull; {item.time}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-semibold text-rose-400">
                              -{formatRupiah(item.amount, hideBalances)}
                            </span>
                            <button
                              onClick={() => onOpenReceipt(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Struk"
                            >
                              <Receipt className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {previousDays.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500 rounded-xl bg-slate-950/30 border border-slate-800/60">
              Belum ada riwayat hari sebelumnya. Setiap pengeluaran yang dicatat akan otomatis terarsip dan dikelompokkan per hari di sini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
