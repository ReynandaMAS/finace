import * as XLSX from 'xlsx';
import { Transaction, Category, Account, Budget, SavingsGoal, SalaryConfig } from '../types/finance';

export interface ExcelImportResult {
  transactions: Array<Omit<Transaction, 'id' | 'createdAt' | 'referenceNumber' | 'createdByUserId' | 'createdByName'>>;
  importedCount: number;
  errors: string[];
}

/**
 * Ekspor seluruh database FinanKu ke file Excel (.xlsx) dengan multi-sheet
 */
export const exportCompleteDatabaseToExcel = (data: {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  salaryConfig: SalaryConfig;
  userName?: string;
}) => {
  const wb = XLSX.utils.book_new();

  // SHEET 1: TRANSAKSI KEUANGAN
  const txRows = data.transactions.map((t, idx) => {
    const cat = data.categories.find((c) => c.id === t.categoryId);
    const acc = data.accounts.find((a) => a.id === t.accountId);
    const targetAcc = t.targetAccountId ? data.accounts.find((a) => a.id === t.targetAccountId) : null;

    return {
      No: idx + 1,
      Tanggal: t.date,
      Jam: t.time || '-',
      Jenis: t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer Antar Rekening',
      Kategori: cat?.name || 'Umum',
      Keterangan: t.description,
      Jumlah_IDR: t.amount,
      Dompet_Asal: acc?.name || '-',
      Dompet_Tujuan: targetAcc?.name || '-',
      Catatan_Tambahan: t.notes || '-',
      No_Referensi: t.referenceNumber,
      Dicatat_Oleh: t.createdByName,
      Waktu_Input: t.createdAt,
    };
  });
  const wsTx = XLSX.utils.json_to_sheet(txRows.length > 0 ? txRows : [
    { No: 1, Tanggal: new Date().toISOString().slice(0, 10), Jam: '12:00', Jenis: 'Pengeluaran', Kategori: 'Makan & Minum Harian', Keterangan: 'Contoh: Makan Siang', Jumlah_IDR: 35000, Dompet_Asal: 'Dompet Tunai', Dompet_Tujuan: '-', Catatan_Tambahan: '-', No_Referensi: 'REF-001', Dicatat_Oleh: 'Admin', Waktu_Input: new Date().toISOString() }
  ]);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Buku_Transaksi');

  // SHEET 2: POS ALOKASI GAJI
  const envRows = data.salaryConfig.envelopes.map((env, idx) => {
    return {
      No: idx + 1,
      Nama_Pos: env.name,
      Kategori_Terkait: env.categoryIds.join(', '),
      Alokasi_Gaji_IDR: env.allocatedAmount,
      Jenis_Pos: env.isSavings ? 'Tabungan / Investasi' : 'Beban Konsumsi',
    };
  });
  const wsSalary = XLSX.utils.json_to_sheet(envRows);
  XLSX.utils.book_append_sheet(wb, wsSalary, 'Pos_Alokasi_Gaji');

  // SHEET 3: ANGGARAN BELANJA
  const budgetRows = data.budgets.map((b, idx) => {
    const cat = data.categories.find((c) => c.id === b.categoryId);
    return {
      No: idx + 1,
      Kategori: cat?.name || 'Kategori',
      Batas_Maksimal_IDR: b.limitAmount,
      Bulan: b.month,
      Tahun: b.year,
    };
  });
  const wsBudget = XLSX.utils.json_to_sheet(budgetRows.length > 0 ? budgetRows : [
    { No: 1, Kategori: 'Makan & Minum Harian', Batas_Maksimal_IDR: 2500000, Bulan: new Date().getMonth() + 1, Tahun: new Date().getFullYear() }
  ]);
  XLSX.utils.book_append_sheet(wb, wsBudget, 'Anggaran_Belanja');

  // SHEET 4: REKENING & DOMPET KAS
  const accRows = data.accounts.map((a, idx) => ({
    No: idx + 1,
    Nama_Dompet: a.name,
    Institusi_Bank: a.bankName,
    Nomor_Rekening: a.accountNumber,
    Jenis: a.type,
    Saldo_Terkini_IDR: a.currentBalance,
    Saldo_Awal_IDR: a.initialBalance,
  }));
  const wsAcc = XLSX.utils.json_to_sheet(accRows);
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Dompet_Rekening');

  // SHEET 5: TARGET TABUNGAN
  const goalRows = data.savingsGoals.map((g, idx) => ({
    No: idx + 1,
    Nama_Target: g.name,
    Kategori: g.category,
    Target_Nominal_IDR: g.targetAmount,
    Terkumpul_IDR: g.currentAmount,
    Batas_Waktu: g.deadline,
  }));
  const wsGoal = XLSX.utils.json_to_sheet(goalRows.length > 0 ? goalRows : [
    { No: 1, Nama_Target: 'Dana Darurat', Kategori: 'Darurat', Target_Nominal_IDR: 10000000, Terkumpul_IDR: 0, Batas_Waktu: '2027-12-31' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsGoal, 'Target_Tabungan');

  // Generate and download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `FinanKu_Database_Excel_${dateStr}.xlsx`);
};

/**
 * Download Template Excel Kosong Siap Isi
 */
export const downloadExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  const templateRows = [
    {
      Tanggal: '2026-10-27',
      Jam: '12:30',
      Jenis: 'Pengeluaran',
      Kategori: 'Makan & Minum Harian',
      Keterangan: 'Makan siang nasi padang',
      Jumlah: 45000,
      Catatan: 'Bayar tunai di warung',
    },
    {
      Tanggal: '2026-10-27',
      Jam: '15:15',
      Jenis: 'Pengeluaran',
      Kategori: 'Ngopi, Jajan & Kuliner Santai',
      Keterangan: 'Kopi gula aren sore',
      Jumlah: 25000,
      Catatan: 'Jajan santai',
    },
    {
      Tanggal: '2026-10-27',
      Jam: '17:00',
      Jenis: 'Pengeluaran',
      Kategori: 'Bensin, Tol & Ojol (Transport)',
      Keterangan: 'Isi Pertamax motor',
      Jumlah: 35000,
      Catatan: 'SPBU Shell / Pertamina',
    },
    {
      Tanggal: '2026-10-25',
      Jam: '09:00',
      Jenis: 'Pemasukan',
      Kategori: 'Gaji Bulanan Utama',
      Keterangan: 'Gaji bulanan masuk',
      Jumlah: 15000000,
      Catatan: 'Payroll perusahaan',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Transaksi');

  // Sheet Petunjuk Pengisian
  const petunjukRows = [
    {
      Kolom: 'Tanggal',
      Format: 'YYYY-MM-DD (Contoh: 2026-10-27)',
      Keterangan: 'Wajib diisi sesuai tanggal transaksi',
    },
    {
      Kolom: 'Jam',
      Format: 'HH:mm (Contoh: 14:30)',
      Keterangan: 'Opsional, jam pencatatan pengeluaran',
    },
    {
      Kolom: 'Jenis',
      Format: 'Pengeluaran / Pemasukan / Transfer',
      Keterangan: 'Tipe mutasi dana',
    },
    {
      Kolom: 'Kategori',
      Format: 'Teks Kategori',
      Keterangan: 'Contoh: Makan & Minum Harian, Belanja Pasar, Bensin, Listrik, Jajan, Gaji',
    },
    {
      Kolom: 'Keterangan',
      Format: 'Teks Deskripsi',
      Keterangan: 'Nama transaksi belanja / jajan',
    },
    {
      Kolom: 'Jumlah',
      Format: 'Angka nominal tanpa titik/koma (Contoh: 50000)',
      Keterangan: 'Nilai Rupiah transaksi',
    },
    {
      Kolom: 'Catatan',
      Format: 'Teks bebas',
      Keterangan: 'Catatan tambahan atau nama toko / warung',
    },
  ];

  const wsPetunjuk = XLSX.utils.json_to_sheet(petunjukRows);
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk_Pengisian');

  XLSX.writeFile(wb, 'FinanKu_Template_Input_Excel.xlsx');
};

/**
 * Membaca dan mem-parsing file Excel (.xlsx / .xls / .csv) yang di-upload pengguna
 */
export const parseUploadedExcelFile = async (file: File): Promise<ExcelImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ambil sheet pertama atau sheet bernama 'Buku_Transaksi' / 'Template_Transaksi'
        const sheetName =
          workbook.SheetNames.find((s) => s.includes('Transaksi')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          resolve({ transactions: [], importedCount: 0, errors: ['Sheet data transaksi tidak ditemukan.'] });
          return;
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawRows.length === 0) {
          resolve({ transactions: [], importedCount: 0, errors: ['File Excel tidak memiliki baris data.'] });
          return;
        }

        const parsedTransactions: Array<
          Omit<Transaction, 'id' | 'createdAt' | 'referenceNumber' | 'createdByUserId' | 'createdByName'>
        > = [];
        const errors: string[] = [];

        rawRows.forEach((row, idx) => {
          // Cari kolom keterangan
          const description =
            row['Keterangan'] || row['Deskripsi'] || row['Description'] || row['keterangan'] || '';
          
          // Cari kolom jumlah/nominal
          const rawAmount =
            row['Jumlah_IDR'] || row['Jumlah'] || row['Nominal'] || row['Amount'] || row['amount'] || 0;
          const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9]/g, '')) || 0;

          // Cari tanggal
          let dateStr = row['Tanggal'] || row['Date'] || row['tanggal'] || '';
          if (!dateStr || String(dateStr).trim() === '') {
            dateStr = new Date().toISOString().slice(0, 10);
          } else if (typeof dateStr === 'number') {
            // Excel serial date number
            const dateObj = new Date((dateStr - (25567 + 2)) * 86400 * 1000);
            dateStr = dateObj.toISOString().slice(0, 10);
          }

          // Cari jenis
          const jenisRaw = String(row['Jenis'] || row['Tipe'] || row['Type'] || '').toLowerCase();
          const type: 'income' | 'expense' | 'transfer' = jenisRaw.includes('masuk') || jenisRaw.includes('income')
            ? 'income'
            : jenisRaw.includes('transfer')
            ? 'transfer'
            : 'expense';

          // Jam
          const time = row['Jam'] || row['Time'] || row['Waktu'] || undefined;

          // Catatan
          const notes = row['Catatan_Tambahan'] || row['Catatan'] || row['Notes'] || undefined;

          // Kategori
          const categoryName = String(row['Kategori'] || row['Category'] || 'Umum');

          if (!description && amount <= 0) {
            // Skip empty row
            return;
          }

          if (amount <= 0) {
            errors.push(`Baris ${idx + 2}: Nominal transaksi harus lebih besar dari Rp 0.`);
            return;
          }

          parsedTransactions.push({
            date: dateStr,
            time: typeof time === 'string' ? time : undefined,
            type,
            amount,
            categoryId: categoryName, // Akan dicocokkan atau dibuat saat import
            accountId: 'acc_kas',
            description: description || 'Transaksi dari Excel',
            notes,
          });
        });

        resolve({
          transactions: parsedTransactions,
          importedCount: parsedTransactions.length,
          errors,
        });
      } catch (err: any) {
        resolve({
          transactions: [],
          importedCount: 0,
          errors: [`Gagal membaca file Excel: ${err?.message || 'Format tidak didukung'}`],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        transactions: [],
        importedCount: 0,
        errors: ['Gagal membaca berkas file.'],
      });
    };

    reader.readAsArrayBuffer(file);
  });
};
