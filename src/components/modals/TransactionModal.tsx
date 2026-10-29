import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  X,
  CreditCard,
  Tag,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
}) => {
  const { accounts, categories, addTransaction, updateTransaction, hideBalances } = useFinance();

  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setAccountId(editingTransaction.accountId);
      setTargetAccountId(editingTransaction.targetAccountId || '');
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setNotes(editingTransaction.notes || '');
    } else {
      // Defaults
      setType('income');
      setAmount('');
      setAccountId(accounts[0]?.id || '');
      setTargetAccountId(accounts[1]?.id || '');
      const defaultCategory = categories.find((c) => c.type === 'income');
      setCategoryId(defaultCategory?.id || categories[0]?.id || '');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setNotes('');
    }
  }, [editingTransaction, accounts, categories, isOpen]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter((c) => {
    if (type === 'transfer') return true;
    return c.type === type;
  });

  const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      alert('Nominal harus lebih besar dari Rp 0.');
      return;
    }
    if (!description.trim()) {
      alert('Keterangan transaksi wajib diisi.');
      return;
    }
    if (type === 'transfer' && accountId === targetAccountId) {
      alert('Rekening sumber dan rekening tujuan tidak boleh sama.');
      return;
    }

    const nowTime = new Date();
    const timeStr = `${String(nowTime.getHours()).padStart(2, '0')}:${String(
      nowTime.getMinutes()
    ).padStart(2, '0')}`;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount: parsedAmount,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        categoryId,
        date,
        time: editingTransaction.time || timeStr,
        description,
        notes,
      });
    } else {
      addTransaction({
        type,
        amount: parsedAmount,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        categoryId,
        date,
        time: timeStr,
        description,
        notes,
      });
    }

    onClose();
  };

  const addPresetAmount = (val: number) => {
    const current = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;
    setAmount((current + val).toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div>
            <h3 className="text-base font-bold text-white">
              {editingTransaction ? 'Edit Catatan Transaksi' : 'Catat Transaksi Keuangan'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mutasi saldo akan diperbarui dan dicatat dalam buku kas utama secara instan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Segmented Controls */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('income');
                const cat = categories.find((c) => c.type === 'income');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Pemasukan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cat = categories.find((c) => c.type === 'expense');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Pengeluaran</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('transfer');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Input with Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Nominal Transaksi (IDR) *</label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatRupiah(parsedAmount)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">
                Rp
              </span>
              <input
                type="text"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Fast preset buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[20000, 50000, 100000, 250000, 500000, 1000000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => addPresetAmount(val)}
                  className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  +{val >= 1000000 ? `${val / 1000000}Jt` : `${val / 1000}Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {type === 'transfer' ? 'Dari Dompet/Rekening (Asal) *' : 'Dompet / Rekening Pembayaran *'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatRupiah(a.currentBalance, hideBalances)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ke Dompet/Rekening (Tujuan) *
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === accountId}>
                      {a.name} ({formatRupiah(a.currentBalance, hideBalances)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori Pengeluaran / Pemasukan *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Keterangan Singkat *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Makan siang warteg, bensin, belanja dapur..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              {type === 'expense' && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500">Preset harian:</span>
                  {[
                    { label: 'Makan Siang', cat: 'cat_food', amt: 35000 },
                    { label: 'Kopi & Jajan', cat: 'cat_jajan', amt: 25000 },
                    { label: 'Bensin Motor', cat: 'cat_transport', amt: 35000 },
                    { label: 'Belanja Sayur Dapur', cat: 'cat_groceries', amt: 75000 },
                    { label: 'Token Listrik PLN', cat: 'cat_utilities', amt: 100000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDescription(preset.label);
                        if (!amount) setAmount(preset.amt.toString());
                        const foundCat = categories.find((c) => c.id === preset.cat);
                        if (foundCat) setCategoryId(foundCat.id);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan belanja, nama warung, atau pengingat..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors"
            >
              {editingTransaction ? 'Simpan Perubahan' : 'Konfirmasi & Catat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
