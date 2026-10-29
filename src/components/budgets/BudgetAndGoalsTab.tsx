import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  PiggyBank,
  Plus,
  Target,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Shield,
  Edit2,
  Trash2,
  Coins,
  Sparkles,
  ShoppingBag,
  PlusCircle,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import { formatRupiah, formatCompactRupiah, formatIndoDate } from '../../utils/formatters';
import { Category, Budget } from '../../types/finance';

export const BudgetAndGoalsTab: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    savingsGoals,
    addBudget,
    updateBudget,
    deleteBudget,
    setBudgetForCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    addSavingsGoal,
    depositToGoal,
    hideBalances,
    hasPermission,
  } = useFinance();

  // Modals for Budget
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    id: string;
    categoryId: string;
    categoryName: string;
    limitAmount: number;
    color: string;
  } | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<{
    id: string;
    categoryId: string;
    categoryName: string;
  } | null>(null);

  // Form fields for Add Budget
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('new_custom');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#10B981');
  const [budgetLimitInput, setBudgetLimitInput] = useState<string>('1500000');

  // Modals for Savings Goals
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCategory, setGoalCategory] = useState('Dana Darurat Keluarga');
  const [goalDeadline, setGoalDeadline] = useState('2027-06-30');

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState('');

  // Expenses for current month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [transactions, currentYear, currentMonth]);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  // Combine active budgets with category data
  // An item is considered an active budget if:
  // 1. It exists in `budgets` array with limitAmount > 0
  // OR 2. It's an expense category with category.budgetMonthly > 0
  const activeBudgetItems = useMemo(() => {
    const list: Array<{
      budgetId: string;
      categoryId: string;
      categoryName: string;
      color: string;
      icon: string;
      limitAmount: number;
      spentAmount: number;
      ratio: number;
      isOver: boolean;
      isWarning: boolean;
      isCustomCategory: boolean;
    }> = [];

    // Map by categoryId to avoid duplicates
    const seenCategoryIds = new Set<string>();

    budgets.forEach((b) => {
      if (b.limitAmount > 0 && !seenCategoryIds.has(b.categoryId)) {
        seenCategoryIds.add(b.categoryId);
        const cat = categories.find((c) => c.id === b.categoryId);
        const spent = currentMonthTransactions
          .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);

        const ratio = Math.round((spent / b.limitAmount) * 100);
        list.push({
          budgetId: b.id,
          categoryId: b.categoryId,
          categoryName: cat?.name || 'Kategori Belanja',
          color: cat?.color || '#3B82F6',
          icon: cat?.icon || 'ShoppingBag',
          limitAmount: b.limitAmount,
          spentAmount: spent,
          ratio,
          isOver: ratio >= 100,
          isWarning: ratio >= 75 && ratio < 100,
          isCustomCategory: !cat?.id.startsWith('cat_ex_default'),
        });
      }
    });

    // Also include any expense category that has a budgetMonthly > 0 and not yet in list
    expenseCategories.forEach((cat) => {
      if (cat.budgetMonthly && cat.budgetMonthly > 0 && !seenCategoryIds.has(cat.id)) {
        seenCategoryIds.add(cat.id);
        const spent = currentMonthTransactions
          .filter((t) => t.type === 'expense' && t.categoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);

        const ratio = Math.round((spent / cat.budgetMonthly) * 100);
        list.push({
          budgetId: `temp_bgt_${cat.id}`,
          categoryId: cat.id,
          categoryName: cat.name,
          color: cat.color || '#3B82F6',
          icon: cat.icon || 'ShoppingBag',
          limitAmount: cat.budgetMonthly,
          spentAmount: spent,
          ratio,
          isOver: ratio >= 100,
          isWarning: ratio >= 75 && ratio < 100,
          isCustomCategory: false,
        });
      }
    });

    return list;
  }, [budgets, categories, expenseCategories, currentMonthTransactions]);

  // Aggregate stats
  const totalBudgetLimit = activeBudgetItems.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalBudgetSpent = activeBudgetItems.reduce((sum, b) => sum + b.spentAmount, 0);
  const overallRatio =
    totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;
  const remainingBudget = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  // Categories available for adding budget (those without an active budget)
  const availableCategoriesForBudget = useMemo(() => {
    const activeCatIds = new Set(activeBudgetItems.map((b) => b.categoryId));
    return expenseCategories.filter((c) => !activeCatIds.has(c.id));
  }, [expenseCategories, activeBudgetItems]);

  // Handlers for Add Budget
  const handleOpenAddBudget = () => {
    if (availableCategoriesForBudget.length > 0) {
      setSelectedCategoryId(availableCategoriesForBudget[0].id);
    } else {
      setSelectedCategoryId('new_custom');
    }
    setNewCategoryName('');
    setNewCategoryColor('#10B981');
    setBudgetLimitInput('1500000');
    setIsAddBudgetModalOpen(true);
  };

  const handleSaveNewBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimitInput.replace(/[^0-9]/g, '')) || 0;
    if (limit <= 0) {
      alert('Nominal batas anggaran harus lebih besar dari Rp 0.');
      return;
    }

    let targetCatId = selectedCategoryId;

    if (selectedCategoryId === 'new_custom') {
      if (!newCategoryName.trim()) {
        alert('Silakan masukkan nama kategori belanja baru.');
        return;
      }
      // Create new category
      const newCat = addCategory({
        name: newCategoryName.trim(),
        type: 'expense',
        icon: 'ShoppingBag',
        color: newCategoryColor,
        budgetMonthly: limit,
      });
      targetCatId = newCat.id;
    }

    addBudget(targetCatId, limit);
    setIsAddBudgetModalOpen(false);
  };

  // Handlers for Edit Budget
  const handleOpenEditBudget = (item: typeof activeBudgetItems[0]) => {
    setEditingBudget({
      id: item.budgetId,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      limitAmount: item.limitAmount,
      color: item.color,
    });
    setBudgetLimitInput(item.limitAmount.toString());
  };

  const handleSaveEditBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    const limit = parseFloat(budgetLimitInput.replace(/[^0-9]/g, '')) || 0;
    if (limit <= 0) {
      alert('Nominal batas anggaran harus lebih dari Rp 0.');
      return;
    }

    if (editingBudget.id.startsWith('temp_bgt_')) {
      // It's a category fallback budget, create formal budget
      addBudget(editingBudget.categoryId, limit);
      updateCategory(editingBudget.categoryId, {
        name: editingBudget.categoryName,
        budgetMonthly: limit,
        color: editingBudget.color,
      });
    } else {
      updateBudget(editingBudget.id, limit);
      updateCategory(editingBudget.categoryId, {
        name: editingBudget.categoryName,
        budgetMonthly: limit,
        color: editingBudget.color,
      });
    }

    setEditingBudget(null);
  };

  // Handlers for Delete Budget
  const handleConfirmDeleteBudget = () => {
    if (!deletingBudget) return;

    if (deletingBudget.id.startsWith('temp_bgt_')) {
      // Update category to have budgetMonthly: 0
      updateCategory(deletingBudget.categoryId, { budgetMonthly: 0 });
    } else {
      deleteBudget(deletingBudget.id);
      updateCategory(deletingBudget.categoryId, { budgetMonthly: 0 });
    }

    setDeletingBudget(null);
  };

  // Quick Starter Preset Applicator
  const handleApplyRecommendedBudgets = () => {
    const starterPresets = [
      { name: 'Makan & Minum Harian', amt: 2500000, color: '#F97316' },
      { name: 'Belanja Pasar & Supermarket', amt: 2000000, color: '#EF4444' },
      { name: 'Bensin & Transport Harian', amt: 800000, color: '#06B6D4' },
      { name: 'Listrik, Wifi & Pulsa', amt: 1200000, color: '#EAB308' },
      { name: 'Ngopi & Jajan Santai', amt: 600000, color: '#8B5CF6' },
    ];

    starterPresets.forEach((p) => {
      let cat = expenseCategories.find(
        (c) => c.name.toLowerCase().includes(p.name.slice(0, 5).toLowerCase())
      );
      if (!cat) {
        cat = addCategory({
          name: p.name,
          type: 'expense',
          icon: 'ShoppingBag',
          color: p.color,
          budgetMonthly: p.amt,
        });
      }
      addBudget(cat.id, p.amt);
    });
  };

  // Goals
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(goalTarget.replace(/[^0-9]/g, '')) || 0;
    if (!goalName.trim() || val <= 0) {
      alert('Nama target dan nominal wajib diisi.');
      return;
    }

    addSavingsGoal({
      name: goalName,
      targetAmount: val,
      deadline: goalDeadline,
      category: goalCategory,
      color: '#10B981',
      icon: 'Shield',
    });

    setIsNewGoalModalOpen(false);
    setGoalName('');
    setGoalTarget('');
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const val = parseFloat(depositAmountInput.replace(/[^0-9]/g, '')) || 0;
    if (val <= 0) return;
    depositToGoal(depositGoalId, val);
    setDepositGoalId(null);
    setDepositAmountInput('');
  };

  const addPresetAmount = (val: number) => {
    const current = parseFloat(budgetLimitInput.replace(/[^0-9]/g, '')) || 0;
    setBudgetLimitInput((current + val).toString());
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Anggaran Belanja & Target Finansial</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
              Bulan Berjalan
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tetapkan batas maksimal pengeluaran bulanan (makan, belanja dapur, bensin, jajan) agar keuangan keluarga tetap terarah dan aman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {hasPermission('canManageBudgets') && (
            <button
              onClick={handleOpenAddBudget}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/40 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Anggaran Belanja</span>
            </button>
          )}

          <button
            onClick={() => setIsNewGoalModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Target Tabungan</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip for Active Budgets */}
      {activeBudgetItems.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">
                Total Plafon Anggaran Ditetapkan:
              </span>
              <div className="text-xl font-bold text-white font-mono tabular-nums mt-0.5">
                {formatRupiah(totalBudgetLimit, hideBalances)}
              </div>
              <span className="text-[10px] text-slate-500">
                Dari {activeBudgetItems.length} pos anggaran aktif
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium">
                Total Pengeluaran Bulan Ini:
              </span>
              <div className="text-xl font-bold text-rose-400 font-mono tabular-nums mt-0.5">
                -{formatRupiah(totalBudgetSpent, hideBalances)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {overallRatio}% dari batas maksimum
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-medium">
                Sisa Kuota Anggaran Bebas:
              </span>
              <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                {formatRupiah(remainingBudget, hideBalances)}
              </div>
              <span className="text-[10px] text-slate-500">
                Aman dan belum terpakai
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Tingkat Konsumsi:</span>
                <span className="font-mono font-bold text-white">{overallRatio}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallRatio >= 100
                      ? 'bg-rose-500'
                      : overallRatio >= 75
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(overallRatio, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: BATAS ANGGARAN BELANJA (DAPAT DITAMBAH, DIEDIT, DIHAPUS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <span>Daftar Batas Anggaran Belanja Sehari-hari</span>
            </h2>
            <p className="text-xs text-slate-400">
              Setiap pos dapat ditambahkan, diubah nominalnya, atau dihapus kapan saja sesuai kebutuhan rumah tangga.
            </p>
          </div>

          {hasPermission('canManageBudgets') && (
            <button
              onClick={handleOpenAddBudget}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Anggaran Baru</span>
            </button>
          )}
        </div>

        {/* ACTIVE BUDGET CARDS GRID */}
        {activeBudgetItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBudgetItems.map((item) => (
              <div
                key={item.budgetId}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header with Category and Action Icons */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: `${item.color}25`, color: item.color }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                          {item.categoryName}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Batas Bulanan
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Status Ratio Tag */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                          item.isOver
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : item.isWarning
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {item.ratio}%
                      </span>

                      {/* EDIT BUTTON */}
                      {hasPermission('canManageBudgets') && (
                        <button
                          onClick={() => handleOpenEditBudget(item)}
                          title="Ubah Batas Anggaran"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* DELETE BUTTON */}
                      {hasPermission('canManageBudgets') && (
                        <button
                          onClick={() =>
                            setDeletingBudget({
                              id: item.budgetId,
                              categoryId: item.categoryId,
                              categoryName: item.categoryName,
                            })
                          }
                          title="Hapus Batas Anggaran"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Realtime Numbers */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Terpakai:</span>
                      <span
                        className={`font-bold ${
                          item.isOver ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {formatRupiah(item.spentAmount, hideBalances)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Batas (Limit):</span>
                      <span className="text-slate-300 font-semibold">
                        {formatRupiah(item.limitAmount, hideBalances)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isOver ? 'bg-rose-500' : item.isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(item.ratio, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer Sisa Kuota */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Sisa Kuota:</span>
                  <span
                    className={`font-mono font-semibold ${
                      item.isOver ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {item.isOver
                      ? `Melebihi ${formatRupiah(item.spentAmount - item.limitAmount, hideBalances)}`
                      : formatRupiah(item.limitAmount - item.spentAmount, hideBalances)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE WITH QUICK PRESET BUTTON */
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-bold text-white">
                Belum Ada Batas Anggaran yang Ditetapkan
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Buat batas anggaran untuk pos makan, belanja dapur, bensin, atau tagihan agar sistem dapat memonitor konsumsi keuangan harian Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleOpenAddBudget}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Buat Anggaran Belanja Baru</span>
              </button>

              <button
                onClick={handleApplyRecommendedBudgets}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Terapkan Template Rekomendasi (5 Pos)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: TARGET TABUNGAN & DANA DARURAT */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Target Tabungan & Dana Darurat Keluarga</span>
            </h2>
            <p className="text-xs text-slate-400">
              Kumpulkan dana untuk impian keluarga, liburan, pendidikan anak, atau dana darurat.
            </p>
          </div>

          <button
            onClick={() => setIsNewGoalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Target Baru</span>
          </button>
        </div>

        {savingsGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {savingsGoals.map((goal) => {
              const progress = Math.min(
                100,
                goal.targetAmount > 0
                  ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  : 0
              );

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                        >
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white truncate max-w-[170px]">
                            {goal.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {goal.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {progress}%
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Terkumpul:</span>
                        <span className="text-emerald-400 font-bold">
                          {formatRupiah(goal.currentAmount, hideBalances)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Target:</span>
                        <span className="text-slate-300">
                          {formatRupiah(goal.targetAmount, hideBalances)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Target: {formatIndoDate(goal.deadline)}
                    </span>
                    <button
                      onClick={() => {
                        setDepositGoalId(goal.id);
                        setDepositAmountInput('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Setor Tabungan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 rounded-xl bg-slate-900 border border-slate-800">
            Belum ada target tabungan yang dibuat. Klik tombol di atas untuk membuat target baru.
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH ANGGARAN BELANJA (ADD BUDGET) */}
      {isAddBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Tambah Batas Anggaran Belanja</span>
              </h3>
              <button
                onClick={() => setIsAddBudgetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewBudget} className="space-y-4">
              {/* Select Category Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Pos Kategori Belanja *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="new_custom">+ Buat Kategori Belanja Baru Sendiri...</option>
                  {availableCategoriesForBudget.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* If New Custom Category */}
              {selectedCategoryId === 'new_custom' && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Pos Belanja Baru *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Skincare & Gym, Servis Motor, Uang Saku..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Warna Penanda
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        '#10B981',
                        '#3B82F6',
                        '#F97316',
                        '#EF4444',
                        '#8B5CF6',
                        '#EC4899',
                        '#06B6D4',
                        '#EAB308',
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCategoryColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            newCategoryColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Limit Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Batas Maksimum Anggaran Bulanan (IDR) *
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatRupiah(parseFloat(budgetLimitInput.replace(/[^0-9]/g, '')) || 0)}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 self-center">Preset:</span>
                  {[250000, 500000, 1000000, 2000000, 3000000, 5000000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBudgetLimitInput(v.toString())}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
                    >
                      {v >= 1000000 ? `${v / 1000000}Jt` : `${v / 1000}Rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBudgetModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ANGGARAN BELANJA (EDIT BUDGET) */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Ubah Batas Anggaran</span>
              </h3>
              <button
                onClick={() => setEditingBudget(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pos Kategori
                </label>
                <input
                  type="text"
                  required
                  value={editingBudget.categoryName}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, categoryName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Batas Maksimum Bulanan (IDR)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatRupiah(parseFloat(budgetLimitInput.replace(/[^0-9]/g, '')) || 0)}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[250000, 500000, 1000000, 2000000, 3000000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBudgetLimitInput(v.toString())}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
                    >
                      {v >= 1000000 ? `${v / 1000000}Jt` : `${v / 1000}Rb`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS ANGGARAN (DELETE BUDGET) */}
      {deletingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">Hapus Batas Anggaran?</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Apakah Anda yakin ingin menghapus batas anggaran untuk pos{' '}
              <strong className="text-white">"{deletingBudget.categoryName}"</strong>? Batas plafon
              monitoring akan dinonaktifkan, namun catatan transaksi riwayat belanja tetap aman.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingBudget(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBudget}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-950/40 transition-colors"
              >
                Hapus Anggaran Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW GOAL MODAL */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Tambah Target Tabungan Baru</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tentukan target nominal dan batas waktu pencapaian tabungan keluarga.
            </p>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Target Tabungan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Pendidikan Anak, Liburan Akhir Tahun..."
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Target (IDR) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 15000000"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dana Darurat Keluarga">Dana Darurat Keluarga</option>
                    <option value="Pendidikan Anak">Pendidikan Anak</option>
                    <option value="Liburan & Rekreasi">Liburan & Rekreasi</option>
                    <option value="Investasi Rumah / Kendaraan">Investasi Rumah / Kendaraan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batas Waktu (Deadline)
                  </label>
                  <input
                    type="date"
                    required
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Buat Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DEPOSIT TO GOAL MODAL */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Setor ke Tabungan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tambahkan alokasi saldo ke target simpanan ini.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Setoran (IDR)
                </label>
                <input
                  type="text"
                  required
                  value={depositAmountInput}
                  onChange={(e) => setDepositAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] font-mono text-emerald-400 mt-1">
                  Preview: {formatRupiah(parseFloat(depositAmountInput) || 0)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
