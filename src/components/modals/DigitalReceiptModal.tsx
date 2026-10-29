import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Printer, CheckCircle, Building, ShieldCheck } from 'lucide-react';
import { formatRupiah, formatIndoDate, formatIndoDateTime } from '../../utils/formatters';

interface DigitalReceiptModalProps {
  transactionId: string | null;
  onClose: () => void;
}

// Convert numbers to Indonesian words
function terbilang(n: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  if (n < 12) return bilangan[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  if (n < 1000000000)
    return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  if (n < 1000000000000)
    return terbilang(Math.floor(n / 1000000000)) + ' Miliar ' + terbilang(n % 1000000000);
  return 'Nominal Terlalu Besar';
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  transactionId,
  onClose,
}) => {
  const { transactions, accounts, categories } = useFinance();

  if (!transactionId) return null;

  const tx = transactions.find((t) => t.id === transactionId);
  if (!tx) return null;

  const cat = categories.find((c) => c.id === tx.categoryId);
  const acc = accounts.find((a) => a.id === tx.accountId);
  const targetAcc = accounts.find((a) => a.id === tx.targetAccountId);

  const terbilangText = `${terbilang(Math.floor(tx.amount)).trim()} Rupiah`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden relative">
        {/* Modal Controls (Not printed) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Struk Bukti Kas Digital
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="space-y-6 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  FK
                </div>
                <span className="text-base font-bold tracking-tight text-slate-900">
                  FinanKu Harian
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Catatan Keuangan Pribadi & Keluarga</p>
              <p className="text-[11px] text-slate-500">Bukti Transaksi Belanja & Penerimaan</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-bold font-mono tracking-wider text-slate-800">
                {tx.type === 'income' ? 'BUKTI PEMASUKAN' : tx.type === 'expense' ? 'STRUK PENGELUARAN' : 'BUKTI PINDAH DANA'}
              </span>
              <p className="text-xs font-mono font-semibold text-slate-700 mt-1">
                {tx.referenceNumber}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{formatIndoDate(tx.date)}</p>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Sumber Dompet/Akun:</span>
              <span className="col-span-2 font-semibold text-slate-800">
                {acc?.name} ({acc?.bankName})
              </span>
            </div>

            {tx.type === 'transfer' && (
              <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tujuan Simpanan:</span>
                <span className="col-span-2 font-semibold text-blue-700">
                  {targetAcc?.name} ({targetAcc?.bankName})
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Kategori Kebutuhan:</span>
              <span className="col-span-2 font-semibold text-slate-800">{cat?.name || 'Umum'}</span>
            </div>

            <div className="grid grid-cols-3 py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Keperluan / Keterangan:</span>
              <span className="col-span-2 font-semibold text-slate-900">{tx.description}</span>
            </div>

            {tx.notes && (
              <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Catatan / Detail:</span>
                <span className="col-span-2 text-slate-700">{tx.notes}</span>
              </div>
            )}
          </div>

          {/* Nominal Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Jumlah Uang (Nominal)
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {formatRupiah(tx.amount)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs italic text-slate-600">
              <strong>Terbilang:</strong> #{terbilangText}#
            </div>
          </div>

          {/* Verification Signatures */}
          <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-500 text-[11px] mb-8">Dicatat Oleh:</p>
              <p className="font-bold text-slate-900 border-b border-slate-300 pb-1">
                {tx.createdByName}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Pengguna FinanKu</p>
            </div>

            <div>
              <p className="text-slate-500 text-[11px] mb-8">Status Buku Kas:</p>
              <p className="font-bold text-emerald-700 border-b border-slate-300 pb-1">
                Tercatat & Seimbang
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Buku Kas Harian Keluarga</p>
            </div>
          </div>

          {/* Verification Stamp Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TERCATAT SECARA REAL-TIME DI APLIKASI FINANKU</span>
            </div>
            <span>ID: {tx.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
