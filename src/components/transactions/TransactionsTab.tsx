import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Receipt,
  Trash2,
  Calendar,
  Building,
  Edit2,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../utils/formatters';
import { exportCompleteDatabaseToExcel } from '../../utils/excelService';

interface TransactionsTabProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenReceipt: (txId: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
  onOpenReceipt,
}) => {
  const {
    transactions,
    accounts,
    categories,
    budgets,
    savingsGoals,
    salaryConfig,
    currentUser,
    deleteTransaction,
    hideBalances,
    hasPermission,
  } = useFinance();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all | this_month | last_month

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesAccount =
        accountFilter === 'all' || t.accountId === accountFilter || t.targetAccountId === accountFilter;
      const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const d = new Date(t.date);
        const now = new Date();
        if (dateFilter === 'this_month') {
          matchesDate = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        } else if (dateFilter === 'last_month') {
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesDate =
            d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
        }
      }

      return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, accountFilter, categoryFilter, dateFilter]);

  // Aggregate stats of filtered transactions
  const filteredStats = useMemo(() => {
    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = filtered
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
      count: filtered.length,
    };
  }, [filtered]);

  const handleDelete = (id: string, refNum: string) => {
    if (confirm(`Hapus transaksi ${refNum}? Saldo rekening terkait akan otomatis disesuaikan kembali.`)) {
      const res = deleteTransaction(id);
      if (!res.success && res.message) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Buku Kas & Transaksi</span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
              {transactions.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Riwayat seluruh mutasi debit & kredit, transfer dana internal, dan bukti pembayaran digital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {hasPermission('canExportData') && (
            <>
              <button
                onClick={() =>
                  exportCompleteDatabaseToExcel({
                    transactions: filtered,
                    categories,
                    accounts,
                    budgets,
                    savingsGoals,
                    salaryConfig,
                    userName: currentUser?.name,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => exportToCSV(filtered, accounts)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </>
          )}

          {hasPermission('canAddTransaction') && (
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtered Summary Strip */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-400">Total Transaksi Difilter:</span>
          <p className="text-base font-bold text-white font-mono">{filteredStats.count} Transaksi</p>
        </div>
        <div>
          <span className="text-slate-400">Pemasukan Difilter:</span>
          <p className="text-base font-bold text-emerald-400 font-mono">
            +{formatRupiah(filteredStats.income, hideBalances)}
          </p>
        </div>
        <div>
          <span className="text-slate-400">Pengeluaran Difilter:</span>
          <p className="text-base font-bold text-rose-400 font-mono">
            -{formatRupiah(filteredStats.expense, hideBalances)}
          </p>
        </div>
        <div>
          <span className="text-slate-400">Selisih Bersih:</span>
          <p
            className={`text-base font-bold font-mono ${
              filteredStats.net >= 0 ? 'text-white' : 'text-amber-400'
            }`}
          >
            {formatRupiah(filteredStats.net, hideBalances)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan, nomor referensi, catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan (+)</option>
              <option value="expense">Pengeluaran (-)</option>
              <option value="transfer">Transfer Rekening</option>
            </select>

            {/* Account */}
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Rekening</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Tanggal</option>
              <option value="this_month">Bulan Ini (Okt 2026)</option>
              <option value="last_month">Bulan Lalu (Sep 2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Tanggal & Ref</th>
                <th className="py-3.5 px-4">Deskripsi & Kategori</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Rekening Kas</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Dicatat Oleh</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((t) => {
                const isIncome = t.type === 'income';
                const isExpense = t.type === 'expense';
                const cat = categories.find((c) => c.id === t.categoryId);
                const sourceAcc = accounts.find((a) => a.id === t.accountId);
                const targetAcc = accounts.find((a) => a.id === t.targetAccountId);

                return (
                  <tr key={t.id} className="hover:bg-slate-850/60 transition-colors">
                    {/* Date & Ref */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-300 font-medium">
                        {formatIndoDate(t.date)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {t.referenceNumber}
                      </span>
                    </td>

                    {/* Description & Category */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isExpense
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : isExpense ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate max-w-xs">{t.description}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span style={{ color: cat?.color }}>{cat?.name || 'Kategori'}</span>
                            {t.notes && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-500 truncate max-w-[150px]">{t.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Account */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      {t.type === 'transfer' ? (
                        <div className="text-slate-300 text-xs">
                          <span className="font-medium text-slate-400">{sourceAcc?.name}</span>
                          <span className="mx-1 text-slate-500">&rarr;</span>
                          <span className="font-medium text-blue-400">{targetAcc?.name}</span>
                        </div>
                      ) : (
                        <div className="text-slate-300 text-xs font-medium">{sourceAcc?.name}</div>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {sourceAcc?.bankName}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right">
                      <div
                        className={`font-mono tabular-nums font-bold text-xs ${
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
                      <span className="text-[10px] text-slate-500">
                        {isIncome ? 'Masuk' : isExpense ? 'Keluar' : 'Transfer'}
                      </span>
                    </td>

                    {/* Created by */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-slate-300 font-medium">{t.createdByName}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">Verifikasi OK</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenReceipt(t.id)}
                          title="Lihat / Cetak Struk Kwitansi Digital"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {hasPermission('canEditTransaction') && (
                          <button
                            onClick={() => onEditTransaction(t)}
                            title="Edit Transaksi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {hasPermission('canDeleteTransaction') && (
                          <button
                            onClick={() => handleDelete(t.id, t.referenceNumber)}
                            title="Hapus Transaksi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
