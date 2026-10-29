import {
  User,
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  DebtReceivable,
  AuditLog,
  SalaryConfig,
} from '../types/finance';

/**
 * Clean slate (data kosongan, semua user dihapus).
 * Pengguna pertama yang mendaftar otomatis menjadi Super Admin (Kepala Keluarga / Pengelola Utama).
 */
export const INITIAL_USERS: User[] = [];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_kas',
    name: 'Dompet Tunai (Kas Saku)',
    bankName: 'Uang Fisik Saku',
    accountNumber: 'CASH',
    type: 'cash',
    currentBalance: 0,
    initialBalance: 0,
    color: '#10B981',
    iconName: 'Wallet',
  },
  {
    id: 'acc_bank',
    name: 'Rekening Bank Utama',
    bankName: 'Rekening Bank',
    accountNumber: '-',
    type: 'bank',
    currentBalance: 0,
    initialBalance: 0,
    color: '#3B82F6',
    iconName: 'Building2',
  },
  {
    id: 'acc_ewallet',
    name: 'E-Wallet (GoPay / OVO / Dana)',
    bankName: 'Dompet Digital',
    accountNumber: '-',
    type: 'ewallet',
    currentBalance: 0,
    initialBalance: 0,
    color: '#06B6D4',
    iconName: 'Smartphone',
  },
  {
    id: 'acc_tabungan',
    name: 'Tabungan Khusus / Dana Darurat',
    bankName: 'Rekening Simpanan',
    accountNumber: '-',
    type: 'investment',
    currentBalance: 0,
    initialBalance: 0,
    color: '#8B5CF6',
    iconName: 'PiggyBank',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  // Income Sehari-hari
  { id: 'cat_in_gaji', name: 'Gaji Bulanan Utama', type: 'income', icon: 'Briefcase', color: '#10B981' },
  { id: 'cat_in_freelance', name: 'Freelance & Usaha Sampingan', type: 'income', icon: 'Laptop', color: '#059669' },
  { id: 'cat_in_bonus', name: 'Bonus & Insentif Kerja', type: 'income', icon: 'Award', color: '#047857' },
  { id: 'cat_in_invest', name: 'Bunga Rekening & Dividen', type: 'income', icon: 'TrendingUp', color: '#14B8A6' },
  // Expense Sehari-hari
  { id: 'cat_ex_makan', name: 'Makan & Minum Harian', type: 'expense', icon: 'Utensils', color: '#F97316', budgetMonthly: 0 },
  { id: 'cat_ex_belanja', name: 'Belanja Pasar & Supermarket', type: 'expense', icon: 'ShoppingCart', color: '#EF4444', budgetMonthly: 0 },
  { id: 'cat_ex_transport', name: 'Bensin, Tol & Ojol (Transport)', type: 'expense', icon: 'Car', color: '#06B6D4', budgetMonthly: 0 },
  { id: 'cat_ex_tagihan', name: 'Listrik, Air, Wifi & Pulsa', type: 'expense', icon: 'Zap', color: '#EAB308', budgetMonthly: 0 },
  { id: 'cat_ex_ngopi', name: 'Ngopi, Jajan & Kuliner Santai', type: 'expense', icon: 'Coffee', color: '#8B5CF6', budgetMonthly: 0 },
  { id: 'cat_ex_kesehatan', name: 'Kesehatan, Obat & Skincare', type: 'expense', icon: 'HeartPulse', color: '#EC4899', budgetMonthly: 0 },
  { id: 'cat_ex_hiburan', name: 'Hiburan, Liburan & Langganan', type: 'expense', icon: 'Film', color: '#6366F1', budgetMonthly: 0 },
  { id: 'cat_ex_sedekah', name: 'Sedekah, Zakat & Kado Teman', type: 'expense', icon: 'Gift', color: '#10B981', budgetMonthly: 0 },
];

export const INITIAL_SALARY_CONFIG: SalaryConfig = {
  monthlySalary: 0,
  paydayDate: 25,
  envelopes: [
    {
      id: 'env_savings',
      name: 'Pos Tabungan & Investasi',
      allocatedAmount: 0,
      categoryIds: ['cat_in_invest'],
      isSavings: true,
      color: '#10B981',
      icon: 'PiggyBank',
    },
    {
      id: 'env_food',
      name: 'Pos Makan & Kuliner Harian',
      allocatedAmount: 0,
      categoryIds: ['cat_ex_makan'],
      color: '#F97316',
      icon: 'Utensils',
    },
    {
      id: 'env_groceries',
      name: 'Pos Belanja Dapur & Supermarket',
      allocatedAmount: 0,
      categoryIds: ['cat_ex_belanja'],
      color: '#EF4444',
      icon: 'ShoppingCart',
    },
    {
      id: 'env_transport',
      name: 'Pos Bensin, Tol & Ojol',
      allocatedAmount: 0,
      categoryIds: ['cat_ex_transport'],
      color: '#06B6D4',
      icon: 'Car',
    },
    {
      id: 'env_bills',
      name: 'Pos Tagihan Listrik & WiFi',
      allocatedAmount: 0,
      categoryIds: ['cat_ex_tagihan'],
      color: '#EAB308',
      icon: 'Zap',
    },
    {
      id: 'env_lifestyle',
      name: 'Pos Ngopi, Jajan & Camilan',
      allocatedAmount: 0,
      categoryIds: ['cat_ex_ngopi'],
      color: '#8B5CF6',
      icon: 'Coffee',
    },
    {
      id: 'env_health',
      name: 'Pos Kesehatan & Darurat',
      allocatedAmount: 0,
      categoryIds: ['cat_ex_kesehatan', 'cat_ex_sedekah'],
      color: '#EC4899',
      icon: 'HeartPulse',
    },
  ],
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_DEBTS: DebtReceivable[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
