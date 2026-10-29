import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  Building,
  CheckCircle,
  Eye,
  EyeOff,
  UserPlus,
  Zap,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { users, currentUser, login, registerUser, quickSwitchUser } = useFinance();

  const isInitialEmpty = users.length === 0;

  const [mode, setMode] = useState<'login' | 'register'>(isInitialEmpty ? 'register' : 'login');
  const [email, setEmail] = useState(isInitialEmpty ? 'info@theclinic.co.id' : '');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState(isInitialEmpty ? 'Pengelola Utama' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in, modal disappears
  if (currentUser) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = login(email, password);
    if (!res.success) {
      setErrorMessage(res.message || 'Gagal masuk.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Semua kolom wajib diisi.');
      return;
    }
    const res = registerUser(name, email, password, 'super_admin');
    if (!res.success) {
      setErrorMessage(res.message || 'Gagal mendaftar.');
    }
  };

  const handleQuickCreateAdmin = () => {
    setErrorMessage('');
    const res = registerUser(
      name.trim() || 'Pengelola Utama',
      email.trim() || 'info@theclinic.co.id',
      password.trim() || 'password123',
      'super_admin'
    );
    if (!res.success) {
      setErrorMessage(res.message || 'Gagal membuat akun.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Brand & Context / Quick Access */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/30">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  FinanKu Harian
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/60 font-mono">
                    Workspace Kosong
                  </span>
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
              Catatan Keuangan Sehari-hari & Manajemen Akses
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Semua data dan pengguna dummy sebelumnya telah dibersihkan. Aplikasi kini berada dalam kondisi <strong className="text-emerald-400">data kosongan</strong> yang bersih, siap untuk diisi pencatatan riil Anda.
            </p>

            {/* Quick 1-Click Init Button for Empty Slate */}
            {isInitialEmpty ? (
              <div className="mt-6 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Mulai Cepat 1-Klik:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Inisialisasi akun Super Admin pertama secara instan dengan email Anda:
                </p>
                <button
                  type="button"
                  onClick={handleQuickCreateAdmin}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Masuk Cepat sebagai Admin (info@theclinic.co.id)</span>
                </button>
              </div>
            ) : (
              /* If users already exist, show quick persona switch */
              <div className="mt-6">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pilih Akun Terdaftar (1-Klik Masuk):</span>
                </p>

                <div className="space-y-2">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => quickSwitchUser(u.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-xs font-bold text-white">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{u.roleTitle}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-emerald-400 shrink-0 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <span>Masuk</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Enkripsi Penyimpanan Lokal</span>
            <span>FinanKu v2.0 Clean</span>
          </div>
        </div>

        {/* Right Side: Registration / Login Form */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                {isInitialEmpty
                  ? 'Registrasi Akun Utama (Super Admin)'
                  : mode === 'login'
                  ? 'Masuk ke Akun Anda'
                  : 'Daftar Anggota Baru'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isInitialEmpty
                  ? 'Akun pertama otomatis memiliki akses penuh (Kepala Keluarga)'
                  : 'Gunakan akun yang telah didaftarkan'}
              </p>
            </div>

            {!isInitialEmpty && (
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    mode === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    mode === 'register' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daftar
                </button>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={mode === 'login' && !isInitialEmpty ? handleLogin : handleRegister} className="space-y-4">
            {(mode === 'register' || isInitialEmpty) && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Lengkap / Panggilan *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso atau Dokter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="info@theclinic.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>
                {isInitialEmpty
                  ? 'Buat Akun Utama & Buka Dashboard'
                  : mode === 'login'
                  ? 'Masuk ke Sistem'
                  : 'Daftar Sekarang'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-3 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              Setelah masuk, Anda dapat mengundang anggota keluarga atau staff lain melalui tab <strong className="text-slate-400">Akses Anggota</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
