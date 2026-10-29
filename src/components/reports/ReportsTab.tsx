import React, { useRef, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Upload,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle,
  ShieldCheck,
  FileText,
  Sparkles,
  HelpCircle,
  FileCheck,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../utils/formatters';
import {
  exportCompleteDatabaseToExcel,
  downloadExcelTemplate,
  parseUploadedExcelFile,
  ExcelImportResult,
} from '../../utils/excelService';

export const ReportsTab: React.FC = () => {
  const {
    accounts,
    transactions,
    categories,
    budgets,
    savingsGoals,
    salaryConfig,
    currentUser,
    importTransactionsFromExcel,
    resetAllData,
    hideBalances,
    hasPermission,
  } = useFinance();

  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Excel Import Preview Modal State
  const [excelImportData, setExcelImportData] = useState<ExcelImportResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Group transactions for current month
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netOperatingProfit = totalIncome - totalExpense;
  const totalAssets = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  // Expense breakdown
  const expenseByCategory = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => {
      const spent = currentMonthTransactions
        .filter((t) => t.type === 'expense' && t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cat,
        spent,
        percentage: totalExpense > 0 ? ((spent / totalExpense) * 100).toFixed(1) : '0',
      };
    })
    .sort((a, b) => b.spent - a.spent);

  // Income breakdown
  const incomeByCategory = categories
    .filter((c) => c.type === 'income')
    .map((cat) => {
      const earned = currentMonthTransactions
        .filter((t) => t.type === 'income' && t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cat,
        earned,
        percentage: totalIncome > 0 ? ((earned / totalIncome) * 100).toFixed(1) : '0',
      };
    })
    .sort((a, b) => b.earned - a.earned);

  // Handle Export Full Database to Excel
  const handleExportExcel = () => {
    exportCompleteDatabaseToExcel({
      transactions,
      categories,
      accounts,
      budgets,
      savingsGoals,
      salaryConfig,
      userName: currentUser?.name,
    });
  };

  // Handle File Upload from Excel
  const handleExcelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseUploadedExcelFile(file);
    setExcelImportData(result);
    setIsImportModalOpen(true);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  // Confirm Import
  const handleConfirmImportExcel = () => {
    if (!excelImportData || excelImportData.transactions.length === 0) return;

    const count = importTransactionsFromExcel(excelImportData.transactions, importMode);
    setIsImportModalOpen(false);
    setImportSuccessMsg(
      `Sukses mengimpor ${count} transaksi dari Excel dengan mode ${
        importMode === 'replace' ? 'Gantikan Semua Data' : 'Gabungkan Data'
      }!`
    );
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  // JSON export
  const handleExportJSON = () => {
    const backupData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      accounts,
      transactions,
      categories,
      budgets,
      goals: savingsGoals,
      salaryConfig,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `finanku_cadangan_database_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && parsed.accounts) {
          localStorage.setItem('finanku_accounts_v2', JSON.stringify(parsed.accounts));
          localStorage.setItem('finanku_transactions_v2', JSON.stringify(parsed.transactions));
          if (parsed.categories)
            localStorage.setItem('finanku_categories_v2', JSON.stringify(parsed.categories));
          if (parsed.budgets)
            localStorage.setItem('finanku_budgets_v2', JSON.stringify(parsed.budgets));
          if (parsed.goals) localStorage.setItem('finanku_goals_v2', JSON.stringify(parsed.goals));
          if (parsed.salaryConfig)
            localStorage.setItem('finanku_salary_config_v2', JSON.stringify(parsed.salaryConfig));

          alert('Data berhasil dipulihkan dari cadangan! Halaman akan dimuat ulang.');
          window.location.reload();
        } else {
          alert('Format file JSON cadangan tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Laporan & Integrasi Database Excel</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
              Excel Sync Aktif
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ekspor dan impor data 2 arah dengan file Microsoft Excel (.xlsx), laporan laba rugi, dan arsip cadangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {hasPermission('canExportData') && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ekspor ke Excel (.xlsx)</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {importSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {/* PUSAT INTEGRASI DATABASE EXCEL (.XLSX & SPREADSHEET) */}
      <div className="p-6 md:p-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-900/40 shadow-xl space-y-5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Integrasi Database Microsoft Excel (.xlsx) & Spreadsheet
                </h2>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/60 font-mono">
                  Sinkronisasi 2 Arah
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Anda dapat menggunakan file Excel (.xlsx) sebagai media penyimpanan, analisis offline, atau input data massal.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Ekspor Database ke Excel */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                1. Ekspor Seluruh Database ke Excel
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Unduh file <code className="text-emerald-400">.xlsx</code> berisi 5 sheet lengkap: Buku Transaksi, Pos Alokasi Gaji, Anggaran Belanja, Rekening Kas, dan Target Tabungan.
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-950"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File Excel (.xlsx)</span>
            </button>
          </div>

          {/* Card 2: Impor dari Excel */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                2. Impor / Upload File Excel ke Sistem
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Unggah file Excel (<code className="text-blue-400">.xlsx / .xls / .csv</code>) untuk memasukkan puluhan transaksi sekaligus. Tersedia opsi gabungkan atau gantikan data.
              </p>
            </div>

            <button
              onClick={() => excelFileInputRef.current?.click()}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-950"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih & Upload File Excel</span>
            </button>
            <input
              ref={excelFileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelFileSelected}
              className="hidden"
            />
          </div>

          {/* Card 3: Download Template Excel Standar */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                3. Download Template Excel Standar
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Belum punya format Excel? Unduh template resmi siap isi lengkap dengan kolom Tanggal, Kategori, Nominal, Keterangan, dan petunjuk pengisian.
              </p>
            </div>

            <button
              onClick={downloadExcelTemplate}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              <span>Download Template Excel</span>
            </button>
          </div>
        </div>

        {/* FAQ Box: "Apakah Excel bisa jadi database?" */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <HelpCircle className="w-4 h-4" />
            <span>Bagaimana cara kerja Excel sebagai Database di FinanKu?</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            File Excel (.xlsx) di komputer bersifat dokumen lokal offline yang tidak memiliki server API multi-user otomatis. Karena itu, FinanKu menggunakan arsitektur <strong className="text-white">Dua Arah (Hybrid Two-Way Sync)</strong>: Database aplikasi memproses perhitungan sisa gaji, pos alokasi, dan multi-user secara instan, dan Anda memiliki kebebasan penuh untuk <strong>mengekspor seluruh data ke Excel kapan saja</strong>, mengeditnya di Microsoft Excel / Google Sheets, lalu <strong>mengunggahnya kembali</strong> ke aplikasi tanpa kehilangan data.
          </p>
        </div>
      </div>

      {/* Official Financial Report Section */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Laporan Laba / Rugi & Arus Kas Ringkas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              FinanKu Harian · Laporan Buku Besar Akrual & Kas Harian
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Dicetak: {formatIndoDate(new Date().toISOString().slice(0, 10))}
          </span>
        </div>

        {/* 3 Executive High-level Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400">Total Pendapatan Operasional:</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {formatRupiah(totalIncome, hideBalances)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Kredit Kas Masuk</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400">Total Beban Operasional:</span>
            <div className="text-lg font-bold text-rose-400 font-mono mt-1">
              {formatRupiah(totalExpense, hideBalances)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Debit Kas Keluar</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400">Laba Bersih Operasional (Net):</span>
            <div
              className={`text-lg font-bold font-mono mt-1 ${
                netOperatingProfit >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatRupiah(netOperatingProfit, hideBalances)}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
              Margin Bersih: {totalIncome > 0 ? ((netOperatingProfit / totalIncome) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Breakdown Tables (Two columns: Income and Expenses) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Income Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Rincian Pendapatan (Inflow)</span>
              <span className="font-mono">{formatRupiah(totalIncome, hideBalances)}</span>
            </h3>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {incomeByCategory.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/60">
                      <td className="py-2 px-3 font-sans text-slate-200">{c.name}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                        {formatRupiah(c.earned, hideBalances)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">{c.percentage}%</td>
                    </tr>
                  ))}
                  {incomeByCategory.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-500 font-sans text-xs">
                        Belum ada pemasukan bulan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
              <span>Rincian Pengeluaran (Outflow)</span>
              <span className="font-mono">-{formatRupiah(totalExpense, hideBalances)}</span>
            </h3>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {expenseByCategory.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/60">
                      <td className="py-2 px-3 font-sans text-slate-200">{c.name}</td>
                      <td className="py-2 px-3 text-right text-rose-400 font-bold">
                        -{formatRupiah(c.spent, hideBalances)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">{c.percentage}%</td>
                    </tr>
                  ))}
                  {expenseByCategory.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-500 font-sans text-xs">
                        Belum ada pengeluaran bulan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Balance Sheet Highlights */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Ringkasan Neraca Saldo Kas Konsolidasi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {accounts.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs">
                <span className="text-slate-400 truncate block">{a.name}</span>
                <span className="font-mono font-bold text-white block mt-1">
                  {formatRupiah(a.currentBalance, hideBalances)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{a.accountNumber}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total Aktiva Kas Konsolidasi:</span>
            <span className="text-sm font-bold text-emerald-400">
              {formatRupiah(totalAssets, hideBalances)}
            </span>
          </div>
        </div>
      </div>

      {/* Database Backup & Recovery Panel (JSON Raw State) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 print:hidden">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Pencadangan & Pemulihan Sistem Lengkap (JSON Raw Backup)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unduh seluruh konfigurasi sistem dan database lengkap dalam format file JSON aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Download JSON Backup */}
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white transition-all text-left"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <div>
              <p>Unduh Cadangan JSON</p>
              <span className="text-[10px] text-slate-400 font-normal">Simpan database lokal</span>
            </div>
          </button>

          {/* Import JSON Backup */}
          <button
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white transition-all text-left"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <div>
              <p>Pulihkan dari JSON</p>
              <span className="text-[10px] text-slate-400 font-normal">Import file cadangan</span>
            </div>
          </button>
          <input
            ref={jsonFileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />

          {/* Reset data */}
          <button
            onClick={() => {
              if (confirm('Kembalikan seluruh basis data ke kondisi awal kosongan?')) {
                resetAllData();
              }
            }}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-900/40 text-xs font-semibold text-rose-300 transition-all text-left"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <div>
              <p>Reset ke Data Kosong</p>
              <span className="text-[10px] text-rose-400/60 font-normal">Bersihkan seluruh data</span>
            </div>
          </button>
        </div>
      </div>

      {/* EXCEL IMPORT CONFIRMATION & PREVIEW MODAL */}
      {isImportModalOpen && excelImportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>Preview Data Impor dari Excel</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Terdeteksi <strong className="text-emerald-400">{excelImportData.importedCount} baris transaksi</strong> dari file spreadsheet.
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Error alerts if any */}
            {excelImportData.errors.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Catatan Impor:</span>
                </div>
                {excelImportData.errors.slice(0, 3).map((err, i) => (
                  <p key={i} className="text-[11px] text-amber-200/80 font-mono">
                    &bull; {err}
                  </p>
                ))}
              </div>
            )}

            {/* Preview Table of First 5 rows */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl mb-4 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {excelImportData.transactions.slice(0, 8).map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-slate-400">{tx.date}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-sans ${
                            tx.type === 'income'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300 font-sans">{tx.categoryId}</td>
                      <td className="py-2 px-3 text-white font-sans truncate max-w-[180px]">
                        {tx.description}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelImportData.transactions.length > 8 && (
                <div className="py-2 px-3 text-center text-[11px] text-slate-500 bg-slate-950 border-t border-slate-800">
                  ... dan {excelImportData.transactions.length - 8} baris lainnya akan diimpor.
                </div>
              )}
            </div>

            {/* Mode Selection */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mb-4">
              <span className="text-xs font-semibold text-slate-200 block">
                Metode Penggabungan Data:
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                    importMode === 'merge'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-emerald-500"
                  />
                  <div>
                    <p className="font-semibold">Gabungkan Data (Merge)</p>
                    <span className="text-[10px] text-slate-400 block">
                      Tambahkan ke data transaksi saat ini
                    </span>
                  </div>
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                    importMode === 'replace'
                      ? 'bg-rose-950/40 border-rose-500/60 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-rose-500"
                  />
                  <div>
                    <p className="font-semibold text-rose-300">Gantikan Semua (Replace)</p>
                    <span className="text-[10px] text-slate-400 block">
                      Hapus data lama, isi dari Excel ini
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImportExcel}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Konfirmasi & Simpan ke Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
