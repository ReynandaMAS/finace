import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DebtReceivable, DebtType } from '../../types/finance';
import {
  HandCoins,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Phone,
  Trash2,
} from 'lucide-react';
import { formatRupiah, formatIndoDate } from '../../utils/formatters';

export const DebtReceivableTab: React.FC = () => {
  const { debts, addDebt, recordDebtPayment, deleteDebt, hideBalances } = useFinance();

  const [typeFilter, setTypeFilter] = useState<'all' | 'debt' | 'receivable'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // New Debt Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<DebtType>('receivable');
  const [counterparty, setCounterparty] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Repayment Modal
  const [payingDebt, setPayingDebt] = useState<DebtReceivable | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentNote, setRepaymentNote] = useState('');

  // Summary Metrics
  const totalReceivable = debts
    .filter((d) => d.type === 'receivable' && d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalDebt = debts
    .filter((d) => d.type === 'debt' && d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const netCredit = totalReceivable - totalDebt;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;
    if (!counterparty.trim() || val <= 0 || !dueDate) {
      alert('Mohon isi nama pihak, nominal valid, dan tanggal jatuh tempo.');
      return;
    }

    addDebt({
      type: newType,
      counterparty,
      phone,
      totalAmount: val,
      dueDate,
      description,
    });

    setIsAddModalOpen(false);
    setCounterparty('');
    setPhone('');
    setAmount('');
    setDescription('');
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const val = parseFloat(repaymentAmount.replace(/[^0-9]/g, '')) || 0;
    if (val <= 0) return;

    recordDebtPayment(payingDebt.id, val, repaymentNote);
    setPayingDebt(null);
    setRepaymentAmount('');
    setRepaymentNote('');
  };

  const filteredDebts = debts.filter((d) => {
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Hutang & Piutang Usaha</span>
            <span className="text-xs font-medium text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded-full">
              Manajemen Kewajiban
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau tagihan klien (piutang) dan kewajiban pembayaran tempo ke vendor atau mitra kerja.
          </p>
        </div>

        <button
          onClick={() => {
            setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Hutang / Piutang</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Piutang Tertahan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {formatRupiah(totalReceivable, hideBalances)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Uang yang akan masuk dari klien/rekanan</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Hutang Berjalan</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono tabular-nums">
            {formatRupiah(totalDebt, hideBalances)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kewajiban jatuh tempo ke vendor</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Posisi Bersih (Net Receivables)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              netCredit >= 0 ? 'text-white' : 'text-amber-400'
            }`}
          >
            {formatRupiah(netCredit, hideBalances)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Selisih piutang aktif dikurangi hutang</p>
        </div>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({debts.length})
          </button>
          <button
            onClick={() => setTypeFilter('receivable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === 'receivable'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Piutang Klien ({debts.filter((d) => d.type === 'receivable').length})
          </button>
          <button
            onClick={() => setTypeFilter('debt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === 'debt'
                ? 'bg-rose-950 text-rose-300 border border-rose-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hutang Vendor ({debts.filter((d) => d.type === 'debt').length})
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Semua Status Pelunasan</option>
          <option value="unpaid">Belum Dibayar</option>
          <option value="partial">Cicilan Berjalan</option>
          <option value="paid">Lunas</option>
        </select>
      </div>

      {/* Debts Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Pihak Rekanan / Kontak</th>
                <th className="py-3.5 px-4">Tipe & Keterangan</th>
                <th className="py-3.5 px-4">Jatuh Tempo</th>
                <th className="py-3.5 px-4 text-right">Sisa / Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredDebts.map((item) => {
                const isReceivable = item.type === 'receivable';
                const isPaid = item.status === 'paid';
                const dueDateObj = new Date(item.dueDate);
                const isOverdue = !isPaid && dueDateObj < new Date();

                return (
                  <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                    {/* Counterparty */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.counterparty}</div>
                      {item.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Type & Desc */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1 ${
                          isReceivable
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {isReceivable ? 'Piutang (Kita Menagih)' : 'Hutang (Kita Membayar)'}
                      </span>
                      <p className="text-slate-300 text-xs truncate max-w-xs">{item.description}</p>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4">
                      <div
                        className={`font-mono text-xs flex items-center gap-1.5 ${
                          isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatIndoDate(item.dueDate)}</span>
                      </div>
                      {isOverdue && (
                        <span className="text-[10px] text-rose-400 font-medium">Lewat Jatuh Tempo</span>
                      )}
                    </td>

                    {/* Amounts */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="font-bold text-white text-xs">
                        {formatRupiah(item.remainingAmount, hideBalances)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total: {formatRupiah(item.totalAmount, hideBalances)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'paid'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : item.status === 'partial'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {item.status === 'paid'
                          ? 'Lunas'
                          : item.status === 'partial'
                          ? 'Dicicil'
                          : 'Belum Dibayar'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => {
                              setPayingDebt(item);
                              setRepaymentAmount(item.remainingAmount.toString());
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 transition-colors"
                          >
                            Bayar Angsuran
                          </button>
                        )}
                        <button
                          onClick={() => deleteDebt(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada catatan hutang atau piutang dalam kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Debt Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Catat Hutang / Piutang Baru</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pilih apakah ini tagihan piutang dari klien atau kewajiban hutang ke vendor.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('receivable')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    newType === 'receivable'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Piutang (Klien Berhutang)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('debt')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    newType === 'debt'
                      ? 'bg-rose-950 text-rose-300 border-rose-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Hutang (Kita Berhutang)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pihak / Rekanan / Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Prima Solusi Digital"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jatuh Tempo *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Total Nominal (IDR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 15000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Invoice termin ke-2 proyek integrasi API..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay / Repayment Modal */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Catat Pembayaran Angsuran</h3>
            <p className="text-xs text-slate-400 mb-4">
              {payingDebt.type === 'receivable'
                ? `Penerimaan tagihan dari ${payingDebt.counterparty}`
                : `Pembayaran ke ${payingDebt.counterparty}`}
            </p>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Dibayar (IDR)
                </label>
                <input
                  type="text"
                  required
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] font-mono text-emerald-400 mt-1">
                  Preview: {formatRupiah(parseFloat(repaymentAmount) || 0)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Bukti Transfer
                </label>
                <input
                  type="text"
                  placeholder="Transfer via BCA, cek giro..."
                  value={repaymentNote}
                  onChange={(e) => setRepaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
