import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  DebtReceivable,
  AuditLog,
  TabKey,
  SalaryConfig,
  SalaryEnvelope,
} from '../types/finance';
import {
  INITIAL_USERS,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_DEBTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SALARY_CONFIG,
} from '../data/initialData';
import { generateId, generateReferenceNumber } from '../utils/formatters';

interface FinanceContextType {
  currentUser: User | null;
  users: User[];
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  debts: DebtReceivable[];
  auditLogs: AuditLog[];
  hideBalances: boolean;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  toggleHideBalances: () => void;
  // Auth
  login: (email: string, pass: string) => { success: boolean; message?: string };
  quickSwitchUser: (userId: string) => void;
  logout: () => void;
  registerUser: (name: string, email: string, pass: string, role?: User['role']) => { success: boolean; message?: string };
  // User Management
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => { success: boolean; message?: string };
  toggleUserStatus: (userId: string) => void;
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'referenceNumber' | 'createdByUserId' | 'createdByName'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => { success: boolean; message?: string };
  importTransactionsFromExcel: (items: any[], mode?: 'merge' | 'replace') => number;
  // Accounts
  addAccount: (accountData: Omit<Account, 'id' | 'currentBalance'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  // Budgets & Categories
  addBudget: (categoryId: string, limitAmount: number) => Budget;
  updateBudget: (budgetId: string, limitAmount: number) => void;
  deleteBudget: (budgetId: string) => void;
  setBudgetForCategory: (categoryId: string, limitAmount: number) => void;
  addCategory: (categoryData: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  depositToGoal: (id: string, amount: number) => void;
  // Debts
  addDebt: (debt: Omit<DebtReceivable, 'id' | 'createdAt' | 'remainingAmount' | 'payments' | 'status'>) => void;
  recordDebtPayment: (debtId: string, amount: number, note: string) => void;
  deleteDebt: (debtId: string) => void;
  // Salary & Envelope Budgeting
  salaryConfig: SalaryConfig;
  updateSalaryConfig: (newConfig: Partial<SalaryConfig>) => void;
  updateEnvelopeAllocation: (envelopeId: string, amount: number) => void;
  // System
  resetAllData: () => void;
  hasPermission: (permissionKey: keyof User['permissions']) => boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'finanku_users_v2',
  CURRENT_USER: 'finanku_current_user_v2',
  ACCOUNTS: 'finanku_accounts_v2',
  TRANSACTIONS: 'finanku_transactions_v2',
  CATEGORIES: 'finanku_categories_v2',
  BUDGETS: 'finanku_budgets_v2',
  GOALS: 'finanku_goals_v2',
  DEBTS: 'finanku_debts_v2',
  LOGS: 'finanku_logs_v2',
  HIDE_BALANCES: 'finanku_hide_balances_v2',
  SALARY_CONFIG: 'finanku_salary_config_v2',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any v1 cache so user gets a pristine empty slate
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('finanku_') && key.includes('_v1')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore
    }
  }, []);

  // Load initial from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return INITIAL_USERS[0] || null;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
  });

  const [debts, setDebts] = useState<DebtReceivable[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEBTS);
    return saved ? JSON.parse(saved) : INITIAL_DEBTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HIDE_BALANCES);
    return saved === 'true';
  });

  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALARY_CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_SALARY_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Persistence side effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HIDE_BALANCES, String(hideBalances));
  }, [hideBalances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALARY_CONFIG, JSON.stringify(salaryConfig));
  }, [salaryConfig]);

  const updateSalaryConfig = (newConfig: Partial<SalaryConfig>) => {
    setSalaryConfig((prev) => ({ ...prev, ...newConfig }));
    addAuditLog('Atur Gaji & Alokasi', 'Memperbarui konfigurasi gaji pokok atau pos alokasi');
  };

  const updateEnvelopeAllocation = (envelopeId: string, amount: number) => {
    setSalaryConfig((prev) => ({
      ...prev,
      envelopes: prev.envelopes.map((e) => (e.id === envelopeId ? { ...e, allocatedAmount: amount } : e)),
    }));
    addAuditLog('Atur Pos Alokasi', `Mengubah alokasi pos gaji menjadi Rp ${amount.toLocaleString('id-ID')}`);
  };

  // Log action helper
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Sistem',
      userRole: currentUser?.roleTitle || 'User',
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]); // keep last 50 logs
  };

  const toggleHideBalances = () => {
    setHideBalances((prev) => !prev);
  };

  const hasPermission = (permissionKey: keyof User['permissions']): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return !!currentUser.permissions?.[permissionKey];
  };

  // Auth
  const login = (email: string, pass: string) => {
    const target = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (!target) {
      return { success: false, message: 'Email tidak ditemukan dalam sistem.' };
    }
    if (target.status === 'suspended') {
      return { success: false, message: 'Akun Anda dinonaktifkan oleh administrator.' };
    }
    if (target.password && target.password !== pass) {
      return { success: false, message: 'Kata sandi tidak sesuai.' };
    }

    const updated = { ...target, lastLoginAt: new Date().toISOString() };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
    addAuditLog('Login Sistem', `Pengguna ${target.name} (${target.roleTitle}) berhasil masuk.`);
    return { success: true };
  };

  const quickSwitchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated = { ...target, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
      addAuditLog('Ganti Akun Aktif', `Beralih sesi akses ke: ${target.name} [${target.roleTitle}]`);
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('Logout Sistem', `${currentUser.name} keluar dari sistem.`);
    }
    setCurrentUser(null);
  };

  const registerUser = (name: string, email: string, pass: string, role: User['role'] = 'finance_staff') => {
    const existing = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar.' };
    }

    // Pengguna pertama otomatis Super Admin (Kepala Keluarga / Pengelola Utama)
    const effectiveRole: UserRole = users.length === 0 ? 'super_admin' : role;
    const isSuper = effectiveRole === 'super_admin';
    const isManager = effectiveRole === 'finance_admin';

    const newUser: User = {
      id: generateId('user'),
      name,
      email,
      password: pass,
      role: effectiveRole,
      roleTitle: isSuper ? 'Kepala Keluarga / Pengelola Utama' : isManager ? 'Pasangan / Pengelola Belanja' : 'Anggota Keluarga',
      department: isSuper ? 'Pengelola Utama' : 'Keluarga & Pribadi',
      status: 'active',
      permissions: {
        canAddTransaction: true,
        canEditTransaction: isSuper || isManager,
        canDeleteTransaction: isSuper,
        canManageUsers: isSuper,
        canManageBudgets: true,
        canViewReports: true,
        canExportData: true,
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    addAuditLog('Registrasi Pengguna', `Pengguna baru mendaftar: ${name} (${email})`);
    return { success: true };
  };

  // User Management
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => {
    if (!hasPermission('canManageUsers')) {
      alert('Anda tidak memiliki izin untuk menambah pengguna.');
      return;
    }

    const newUser: User = {
      ...userData,
      id: generateId('user'),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    addAuditLog('Tambah Pengguna Tim', `Menambahkan pengguna baru: ${newUser.name} sebagai ${newUser.roleTitle}`);
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    if (!hasPermission('canManageUsers')) {
      alert('Anda tidak memiliki izin untuk mengedit pengguna.');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('Update Pengguna', `Memperbarui profil / izin pengguna ID: ${userId}`);
  };

  const deleteUser = (userId: string) => {
    if (!hasPermission('canManageUsers')) {
      return { success: false, message: 'Hanya Super Admin yang dapat menghapus user.' };
    }
    if (currentUser?.id === userId) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' };
    }
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('Hapus Pengguna', `Menghapus akun pengguna: ${target?.name || userId}`);
    return { success: true };
  };

  const toggleUserStatus = (userId: string) => {
    if (!hasPermission('canManageUsers')) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'active' ? 'suspended' : 'active';
          addAuditLog('Ubah Status User', `Mengubah status ${u.name} menjadi: ${newStatus}`);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  // Transactions CRUD
  const addTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'referenceNumber' | 'createdByUserId' | 'createdByName'>
  ) => {
    if (!hasPermission('canAddTransaction')) {
      alert('Anda tidak memiliki izin untuk mencatat transaksi.');
      return;
    }

    const newTx: Transaction = {
      ...txData,
      id: generateId('trx'),
      referenceNumber: generateReferenceNumber(txData.type),
      createdByUserId: currentUser?.id || 'sys',
      createdByName: currentUser?.name || 'Staff',
      createdAt: new Date().toISOString(),
    };

    // Update balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (newTx.type === 'income' && acc.id === newTx.accountId) {
          return { ...acc, currentBalance: acc.currentBalance + newTx.amount };
        }
        if (newTx.type === 'expense' && acc.id === newTx.accountId) {
          return { ...acc, currentBalance: acc.currentBalance - newTx.amount };
        }
        if (newTx.type === 'transfer') {
          if (acc.id === newTx.accountId) {
            return { ...acc, currentBalance: acc.currentBalance - newTx.amount };
          }
          if (acc.id === newTx.targetAccountId) {
            return { ...acc, currentBalance: acc.currentBalance + newTx.amount };
          }
        }
        return acc;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);

    const typeDesc =
      newTx.type === 'income' ? 'Pemasukan' : newTx.type === 'expense' ? 'Pengeluaran' : 'Transfer Antar Rekening';
    addAuditLog(`Catat ${typeDesc}`, `${newTx.description} senilai Rp ${newTx.amount.toLocaleString('id-ID')}`);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    if (!hasPermission('canEditTransaction')) {
      alert('Anda tidak memiliki izin untuk mengubah transaksi.');
      return;
    }
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return { ...t, ...updates };
        }
        return t;
      })
    );
    addAuditLog('Update Transaksi', `Memperbarui transaksi ID: ${id}`);
  };

  const deleteTransaction = (id: string) => {
    if (!hasPermission('canDeleteTransaction')) {
      return { success: false, message: 'Anda tidak memiliki hak akses untuk menghapus transaksi.' };
    }
    const target = transactions.find((t) => t.id === id);
    if (!target) return { success: false, message: 'Transaksi tidak ditemukan.' };

    // Revert account balance impact
    setAccounts((prev) =>
      prev.map((acc) => {
        if (target.type === 'income' && acc.id === target.accountId) {
          return { ...acc, currentBalance: acc.currentBalance - target.amount };
        }
        if (target.type === 'expense' && acc.id === target.accountId) {
          return { ...acc, currentBalance: acc.currentBalance + target.amount };
        }
        if (target.type === 'transfer') {
          if (acc.id === target.accountId) {
            return { ...acc, currentBalance: acc.currentBalance + target.amount };
          }
          if (acc.id === target.targetAccountId) {
            return { ...acc, currentBalance: acc.currentBalance - target.amount };
          }
        }
        return acc;
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    addAuditLog('Hapus Transaksi', `Menghapus transaksi: ${target.referenceNumber} (${target.description})`);
    return { success: true };
  };

  const importTransactionsFromExcel = (
    items: Array<{
      date: string;
      time?: string;
      type: 'income' | 'expense' | 'transfer';
      amount: number;
      categoryId: string;
      accountId?: string;
      targetAccountId?: string;
      description: string;
      notes?: string;
    }>,
    mode: 'merge' | 'replace' = 'merge'
  ): number => {
    const defaultAccountId = accounts[0]?.id || 'acc_kas';

    const newTransactions: Transaction[] = items.map((item, idx) => {
      let cat = categories.find(
        (c) =>
          c.id === item.categoryId ||
          c.name.toLowerCase() === item.categoryId.toLowerCase() ||
          c.name.toLowerCase().includes(item.categoryId.toLowerCase())
      );
      if (!cat) {
        cat = categories.find((c) => c.type === item.type) || categories[0];
      }

      const refNum = generateReferenceNumber(item.type);
      return {
        id: generateId('trx_xl'),
        date: item.date || new Date().toISOString().slice(0, 10),
        time: item.time || '12:00',
        type: item.type,
        amount: item.amount,
        categoryId: cat ? cat.id : 'cat_ex_makan',
        accountId: item.accountId || defaultAccountId,
        targetAccountId: item.targetAccountId,
        description: item.description,
        referenceNumber: refNum,
        notes: item.notes,
        createdByUserId: currentUser?.id || 'sys',
        createdByName: currentUser?.name || 'Excel Importer',
        createdAt: new Date(Date.now() + idx * 1000).toISOString(),
      };
    });

    if (mode === 'replace') {
      setTransactions(newTransactions);
    } else {
      setTransactions((prev) => [...newTransactions, ...prev]);
    }

    const netSum = newTransactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      return acc;
    }, 0);

    setAccounts((prev) =>
      prev.map((a, idx) => (idx === 0 ? { ...a, currentBalance: a.currentBalance + netSum } : a))
    );

    addAuditLog(
      'Impor Excel',
      `Berhasil mengimpor ${newTransactions.length} transaksi dari file spreadsheet (${mode === 'replace' ? 'Gantikan Semua' : 'Gabungkan'})`
    );

    return newTransactions.length;
  };

  // Accounts
  const addAccount = (accountData: Omit<Account, 'id' | 'currentBalance'>) => {
    const newAcc: Account = {
      ...accountData,
      id: generateId('acc'),
      currentBalance: accountData.initialBalance,
    };
    setAccounts((prev) => [...prev, newAcc]);
    addAuditLog('Tambah Rekening/Kas', `Membuat akun kas/bank baru: ${newAcc.name}`);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  // Budgets & Categories
  const addBudget = (categoryId: string, limitAmount: number): Budget => {
    const existing = budgets.find((b) => b.categoryId === categoryId);
    if (existing) {
      setBudgets((prev) =>
        prev.map((b) => (b.id === existing.id ? { ...b, limitAmount } : b))
      );
      addAuditLog('Atur Anggaran', `Memperbarui batas anggaran menjadi Rp ${limitAmount.toLocaleString('id-ID')}`);
      return { ...existing, limitAmount };
    }
    const newBudget: Budget = {
      id: generateId('bgt'),
      categoryId,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      limitAmount,
    };
    setBudgets((prev) => [...prev, newBudget]);
    const cat = categories.find((c) => c.id === categoryId);
    addAuditLog('Tambah Anggaran', `Menambahkan anggaran baru: ${cat?.name || 'Kategori'} sebesar Rp ${limitAmount.toLocaleString('id-ID')}`);
    return newBudget;
  };

  const updateBudget = (budgetId: string, limitAmount: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, limitAmount } : b))
    );
    const target = budgets.find((b) => b.id === budgetId);
    const cat = categories.find((c) => c.id === target?.categoryId);
    addAuditLog('Ubah Anggaran', `Mengubah batas anggaran ${cat?.name || 'Kategori'} menjadi Rp ${limitAmount.toLocaleString('id-ID')}`);
  };

  const deleteBudget = (budgetId: string) => {
    const target = budgets.find((b) => b.id === budgetId);
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    if (target) {
      const cat = categories.find((c) => c.id === target.categoryId);
      addAuditLog('Hapus Anggaran', `Menghapus anggaran ${cat?.name || 'Kategori'}`);
    }
  };

  const setBudgetForCategory = (categoryId: string, limitAmount: number) => {
    if (limitAmount <= 0) {
      setBudgets((prev) => prev.filter((b) => b.categoryId !== categoryId));
      return;
    }
    addBudget(categoryId, limitAmount);
  };

  const addCategory = (categoryData: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...categoryData,
      id: generateId('cat'),
    };
    setCategories((prev) => [...prev, newCat]);
    addAuditLog('Tambah Kategori', `Menambahkan pos kategori baru: ${newCat.name}`);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
    addAuditLog('Hapus Kategori', `Menghapus kategori pengeluaran ID: ${id}`);
  };

  // Savings Goals
  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: generateId('goal'),
      currentAmount: 0,
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
    addAuditLog('Tambah Target Tabungan', `Membuat target tabungan: ${newGoal.name}`);
  };

  const depositToGoal = (id: string, amount: number) => {
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updatedAmount = Math.min(g.targetAmount, g.currentAmount + amount);
          return { ...g, currentAmount: updatedAmount };
        }
        return g;
      })
    );
    addAuditLog('Setoran Tabungan', `Menyetor Rp ${amount.toLocaleString('id-ID')} ke target tabungan`);
  };

  // Debts
  const addDebt = (
    debtData: Omit<DebtReceivable, 'id' | 'createdAt' | 'remainingAmount' | 'payments' | 'status'>
  ) => {
    const newDebt: DebtReceivable = {
      ...debtData,
      id: generateId('dr'),
      remainingAmount: debtData.totalAmount,
      payments: [],
      status: 'unpaid',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDebts((prev) => [newDebt, ...prev]);
    const label = newDebt.type === 'debt' ? 'Hutang' : 'Piutang';
    addAuditLog(`Catat ${label}`, `${newDebt.counterparty}: Rp ${newDebt.totalAmount.toLocaleString('id-ID')}`);
  };

  const recordDebtPayment = (debtId: string, amount: number, note: string) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          const newRemaining = Math.max(0, d.remainingAmount - amount);
          const newStatus = newRemaining === 0 ? 'paid' : 'partial';
          const newPayment = {
            id: generateId('pay'),
            date: new Date().toISOString().slice(0, 10),
            amount,
            note: note || 'Pembayaran angsuran',
          };
          return {
            ...d,
            remainingAmount: newRemaining,
            status: newStatus,
            payments: [newPayment, ...d.payments],
          };
        }
        return d;
      })
    );
    addAuditLog('Pelunasan Hutang/Piutang', `Mencatat pembayaran Rp ${amount.toLocaleString('id-ID')}`);
  };

  const deleteDebt = (debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(INITIAL_CATEGORIES);
    setBudgets(INITIAL_BUDGETS);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setDebts(INITIAL_DEBTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSalaryConfig(INITIAL_SALARY_CONFIG);
    setHideBalances(false);
    localStorage.clear();
    addAuditLog('Reset Data', 'Mengembalikan seluruh data ke data demo awal');
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users,
        accounts,
        transactions,
        categories,
        budgets,
        savingsGoals,
        debts,
        auditLogs,
        hideBalances,
        activeTab,
        setActiveTab,
        toggleHideBalances,
        login,
        quickSwitchUser,
        logout,
        registerUser,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactionsFromExcel,
        addAccount,
        updateAccount,
        addBudget,
        updateBudget,
        deleteBudget,
        setBudgetForCategory,
        addCategory,
        updateCategory,
        deleteCategory,
        addSavingsGoal,
        depositToGoal,
        addDebt,
        recordDebtPayment,
        deleteDebt,
        salaryConfig,
        updateSalaryConfig,
        updateEnvelopeAllocation,
        resetAllData,
        hasPermission,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
