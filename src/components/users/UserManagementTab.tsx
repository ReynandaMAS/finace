import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { User, UserRole } from '../../types/finance';
import {
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  LogIn,
  SlidersHorizontal,
  History,
  Building,
  Check,
  UserCheck,
} from 'lucide-react';
import { formatIndoDateTime } from '../../utils/formatters';

export const UserManagementTab: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    quickSwitchUser,
    auditLogs,
    hasPermission,
  } = useFinance();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'finance_staff' as UserRole,
    roleTitle: 'Staff Keuangan',
    department: 'Keuangan & Akuntansi',
    status: 'active' as 'active' | 'suspended',
    permissions: {
      canAddTransaction: true,
      canEditTransaction: false,
      canDeleteTransaction: false,
      canManageUsers: false,
      canManageBudgets: false,
      canViewReports: true,
      canExportData: true,
    },
  });

  // Handle role preset selection
  const handleRoleChange = (role: UserRole) => {
    let title = 'Anggota Keluarga / Anak';
    let permissions = {
      canAddTransaction: true,
      canEditTransaction: false,
      canDeleteTransaction: false,
      canManageUsers: false,
      canManageBudgets: false,
      canViewReports: true,
      canExportData: false,
    };

    if (role === 'super_admin') {
      title = 'Kepala Keluarga / Pengguna Utama';
      permissions = {
        canAddTransaction: true,
        canEditTransaction: true,
        canDeleteTransaction: true,
        canManageUsers: true,
        canManageBudgets: true,
        canViewReports: true,
        canExportData: true,
      };
    } else if (role === 'finance_admin') {
      title = 'Pasangan / Pengelola Belanja Harian';
      permissions = {
        canAddTransaction: true,
        canEditTransaction: true,
        canDeleteTransaction: true,
        canManageUsers: false,
        canManageBudgets: true,
        canViewReports: true,
        canExportData: true,
      };
    } else if (role === 'viewer') {
      title = 'Anggota Keluarga (Hanya Lihat)';
      permissions = {
        canAddTransaction: false,
        canEditTransaction: false,
        canDeleteTransaction: false,
        canManageUsers: false,
        canManageBudgets: false,
        canViewReports: true,
        canExportData: true,
      };
    }

    setFormData((prev) => ({
      ...prev,
      role,
      roleTitle: title,
      permissions,
    }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      role: 'finance_staff',
      roleTitle: 'Anak / Anggota Keluarga',
      department: 'Keluarga Inti',
      status: 'active',
      permissions: {
        canAddTransaction: true,
        canEditTransaction: false,
        canDeleteTransaction: false,
        canManageUsers: false,
        canManageBudgets: false,
        canViewReports: true,
        canExportData: true,
      },
    });
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role,
      roleTitle: user.roleTitle,
      department: user.department,
      status: user.status,
      permissions: { ...user.permissions },
    });
    setIsAddModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Nama dan Email wajib diisi.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        roleTitle: formData.roleTitle,
        department: formData.department,
        status: formData.status,
        permissions: formData.permissions,
        ...(formData.password ? { password: formData.password } : {}),
      });
    } else {
      addUser({
        name: formData.name,
        email: formData.email,
        password: formData.password || 'password123',
        role: formData.role,
        roleTitle: formData.roleTitle,
        department: formData.department,
        status: formData.status,
        permissions: formData.permissions,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}"?`)) {
      const res = deleteUser(user.id);
      if (!res.success && res.message) {
        alert(res.message);
      }
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add User Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Manajemen Pengguna & Akses Tim</span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
              RBAC Aktif
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tambah anggota tim baru, atur otorisasi akses finansial, dan pantau log aktivitas pengguna secara real-time.
          </p>
        </div>

        {hasPermission('canManageUsers') ? (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950 transition-all self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Izin kelola user hanya untuk Super Admin</span>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total Pengguna</span>
          <div className="text-xl font-bold text-white font-mono mt-1">{users.length}</div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            {users.filter((u) => u.status === 'active').length} akun aktif
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Super Admin (Owner)</span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {users.filter((u) => u.role === 'super_admin').length}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Akses penuh sistem</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Manajer Keuangan</span>
          <div className="text-xl font-bold text-blue-400 font-mono mt-1">
            {users.filter((u) => u.role === 'finance_admin').length}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Approval & Anggaran</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Staff & Auditor</span>
          <div className="text-xl font-bold text-purple-400 font-mono mt-1">
            {users.filter((u) => u.role === 'finance_staff' || u.role === 'viewer').length}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Input & Verifikasi</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau divisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Level Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="finance_admin">Manajer Keuangan</option>
            <option value="finance_staff">Staff Keuangan</option>
            <option value="viewer">Auditor / Viewer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="suspended">Ditangguhkan</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Pengguna & Departemen</th>
                <th className="py-3.5 px-4">Role & Jabatan</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Cakupan Izin Akses</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Login Terakhir</th>
                <th className="py-3.5 px-4 text-right">Aksi & Uji Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((user) => {
                const isCurrentUser = currentUser?.id === user.id;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      isCurrentUser ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white truncate">{user.name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.2 rounded">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                          <p className="text-[10px] text-slate-500 truncate">{user.department}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            user.role === 'super_admin'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : user.role === 'finance_admin'
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                              : user.role === 'finance_staff'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{user.roleTitle}</span>
                        </span>
                      </div>
                    </td>

                    {/* Permissions tags */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs text-[10px]">
                        {user.permissions.canAddTransaction && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            + Catat Transaksi
                          </span>
                        )}
                        {user.permissions.canEditTransaction && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            Edit Mutasi
                          </span>
                        )}
                        {user.permissions.canDeleteTransaction && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">
                            Hapus
                          </span>
                        )}
                        {user.permissions.canManageUsers && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">
                            Kelola User
                          </span>
                        )}
                        {user.permissions.canManageBudgets && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                            Budget
                          </span>
                        )}
                        {user.permissions.canViewReports && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300">
                            Laporan
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {hasPermission('canManageUsers') && !isCurrentUser ? (
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                            user.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/60 hover:bg-rose-900/60'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Ditangguhkan</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            user.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {user.status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 hidden sm:table-cell text-slate-400 font-mono text-[11px]">
                      {user.lastLoginAt ? formatIndoDateTime(user.lastLoginAt) : 'Belum pernah'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick switch login to test this user */}
                        <button
                          onClick={() => quickSwitchUser(user.id)}
                          title="Login sebagai user ini untuk menguji akses"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-400 hover:text-white hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                        >
                          <LogIn className="w-3 h-3" />
                          <span className="hidden sm:inline">Uji Akses</span>
                        </button>

                        {/* Edit Permissions */}
                        {hasPermission('canManageUsers') && (
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            title="Ubah Role & Hak Akses"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete User */}
                        {hasPermission('canManageUsers') && !isCurrentUser && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Hapus Akun Pengguna"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada pengguna yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Audit Log / Activity Trail */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Log Aktivitas Tim (Audit Trail)</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">50 Riwayat Terakhir</span>
        </div>

        <div className="space-y-2">
          {auditLogs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-4 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{log.userName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({log.userRole})</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                {formatIndoDateTime(log.timestamp)}
              </span>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              Belum ada riwayat aktivitas tim tercatat.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <span>{editingUser ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tentukan profil akun dan izin akses yang diberikan pada sistem FinanKu.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Wijaya"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Pengguna *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="hendra@perusahaan.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kata Sandi Login
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Divisi / Departemen
                  </label>
                  <input
                    type="text"
                    placeholder="Keuangan, Operasional, Pajak"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Role Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tingkat Peran (Level Akses)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'super_admin', label: 'Pengguna Utama', desc: 'Kepala Keluarga' },
                    { key: 'finance_admin', label: 'Pasangan', desc: 'Pengelola Belanja' },
                    { key: 'finance_staff', label: 'Anak / Anggota', desc: 'Catat Uang Saku' },
                    { key: 'viewer', label: 'Tamu / Pengamat', desc: 'Hanya Lihat' },
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.key}
                      onClick={() => handleRoleChange(r.key as UserRole)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.role === r.key
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight">{r.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Matriks Izin Spesifik</span>
                  <span className="text-[10px] text-slate-500 font-normal">Disesuaikan otomatis</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canAddTransaction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canAddTransaction: e.target.checked },
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Dapat Mencatat Transaksi</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canEditTransaction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canEditTransaction: e.target.checked },
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Dapat Mengedit Transaksi</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canDeleteTransaction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canDeleteTransaction: e.target.checked },
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Dapat Menghapus Transaksi</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageUsers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canManageUsers: e.target.checked },
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Dapat Menambah & Kelola User</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canManageBudgets}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canManageBudgets: e.target.checked },
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Dapat Mengatur Anggaran</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.canExportData}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, canExportData: e.target.checked },
                        })
                      }
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Dapat Ekspor Data CSV/Excel</span>
                  </label>
                </div>
              </div>

              {/* Status Radio */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-semibold text-slate-300">Status Akun:</span>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    className="text-emerald-500"
                  />
                  <span>Aktif</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="suspended"
                    checked={formData.status === 'suspended'}
                    onChange={() => setFormData({ ...formData, status: 'suspended' })}
                    className="text-rose-500"
                  />
                  <span>Ditangguhkan (Suspend)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
