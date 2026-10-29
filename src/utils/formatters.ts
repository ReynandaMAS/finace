import { Transaction, Account } from '../types/finance';

/**
 * Format number to Indonesian Rupiah currency format
 * e.g. Rp 14.500.000
 */
export function formatRupiah(amount: number, hideBalance: boolean = false): string {
  if (hideBalance) {
    return 'Rp ••••••••';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format compact Rupiah for charts and badges (e.g. Rp 1.5M, Rp 250Rb)
 */
export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1)} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} Rb`;
  }
  return `${sign}Rp ${abs}`;
}

/**
 * Format standard Indonesian date: e.g. "27 Okt 2026"
 */
export function formatIndoDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format datetime: e.g. "27 Okt 2026, 14:30 WIB"
 */
export function formatIndoDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const datePart = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
    const timePart = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${datePart}, ${timePart} WIB`;
  } catch {
    return isoString;
  }
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Generate reference number for transactions
 */
export function generateReferenceNumber(type: string): string {
  const prefix = type === 'income' ? 'IN' : type === 'expense' ? 'OUT' : 'TRF';
  const rand = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateCode = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${prefix}-${dateCode}-${rand}`;
}

/**
 * Export transactions to CSV file
 */
export function exportToCSV(transactions: Transaction[], accounts: Account[]): void {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = ['No Ref', 'Tanggal', 'Tipe', 'Nominal (IDR)', 'Kategori', 'Rekening', 'Keterangan', 'Dibuat Oleh'];
  const rows = transactions.map((t) => [
    t.referenceNumber,
    t.date,
    t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
    t.amount,
    t.categoryId,
    accountMap.get(t.accountId) || t.accountId,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.createdByName,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `laporan_keuangan_finanku_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
