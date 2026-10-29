export type UserRole = 'super_admin' | 'finance_admin' | 'finance_staff' | 'viewer';

export interface UserPermissions {
  canAddTransaction: boolean;
  canEditTransaction: boolean;
  canDeleteTransaction: boolean;
  canManageUsers: boolean;
  canManageBudgets: boolean;
  canViewReports: boolean;
  canExportData: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatarUrl?: string;
  status: 'active' | 'suspended';
  permissions: UserPermissions;
  createdAt: string;
  lastLoginAt: string;
}

export type AccountType = 'bank' | 'cash' | 'ewallet' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber: string;
  bankName: string;
  currentBalance: number;
  initialBalance: number;
  color: string;
  iconName: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  targetAccountId?: string; // used when type === 'transfer'
  description: string;
  referenceNumber: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  budgetMonthly?: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: number; // 1 - 12
  year: number;
  limitAmount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  color: string;
  icon: string;
}

export type DebtType = 'debt' | 'receivable'; // debt = Hutang kita, receivable = Piutang kita

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface DebtReceivable {
  id: string;
  type: DebtType;
  counterparty: string; // Nama pihak / rekanan / klien
  phone?: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  description: string;
  payments: DebtPayment[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
}

export interface SalaryEnvelope {
  id: string;
  name: string;
  allocatedAmount: number;
  categoryIds: string[];
  isSavings?: boolean;
  color: string;
  icon: string;
}

export interface SalaryConfig {
  monthlySalary: number;
  paydayDate: number;
  envelopes: SalaryEnvelope[];
}

export type TabKey = 'overview' | 'transactions' | 'users' | 'budgets' | 'debts' | 'reports';
