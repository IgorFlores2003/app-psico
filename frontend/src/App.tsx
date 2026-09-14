import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ClipboardList,
  Settings,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  Download,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Archive,
  History,
  X,
  Copy,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  Mail,
  Phone,
  KeyRound,
  Lock,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  apiFetch,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from './services/api';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [route, setRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/responder/')) return path;
      if (path.startsWith('/pacientes/')) return path;
      return path === '/login' ? '/login' : '/';
    }
    return '/';
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Sync route on popstate
  useEffect(() => {
    const handlePop = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setRoute(newPath);
  };

  // Check auth
  useEffect(() => {
    if (route.startsWith('/responder/')) {
      setLoadingUser(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setLoadingUser(false);
      if (route !== '/login') navigate('/login');
      return;
    }

    apiFetch('/auth/me')
      .then((res) => {
        if (res.ok && res.data?.user) {
          setCurrentUser(res.data.user);
        } else {
          clearAuthToken();
          navigate('/login');
        }
      })
      .catch(() => {
        clearAuthToken();
        navigate('/login');
      })
      .finally(() => setLoadingUser(false));
  }, [route]);

  // Inactivity auto logout (20 min)
  useEffect(() => {
    if (route.startsWith('/responder/') || route === '/login') return;

    let idleMins = 0;
    const interval = setInterval(() => {
      idleMins++;
      if (idleMins >= 20) {
        clearAuthToken();
        navigate('/login');
      }
    }, 60000);

    const reset = () => {
      idleMins = 0;
    };

    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    window.addEventListener('click', reset);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('click', reset);
    };
  }, [route]);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ISOLATED PATIENT RESPONDER ROUTE
  if (route.startsWith('/responder/')) {
    const token = route.replace('/responder/', '').split('/')[0];
    return <ResponderView token={token} />;
  }

  // LOGIN ROUTE
  if (route === '/login') {
    return (
      <LoginView
        onSuccess={(user) => {
          setCurrentUser(user);
          navigate('/');
        }}
      />
    );
  }

  // AUTHENTICATED WORKSPACE
  const isPatientDetail = route.startsWith('/pacientes/');
  const patientId = isPatientDetail ? route.replace('/pacientes/', '').split('/')[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-950/40 text-xl">
                Ψ
              </div>
              <div>
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Prontuário Digital
                </h1>
                <p className="text-[11px] text-teal-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Sigilo LGPD Ativo
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => navigate('/')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                route === '/' || isPatientDetail
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Pacientes
            </button>

            <button
              onClick={() => navigate('/escalas')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                route === '/escalas'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Escalas & Questionários
            </button>

            <button
              onClick={() => navigate('/configuracoes')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                route === '/configuracoes'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configurações & Sigilo
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {currentUser?.name || 'Psicóloga'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {currentUser?.email}
              </p>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              AES-256
            </span>
          </div>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer mb-2.5"
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-teal-400" />
                  <span>Modo Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modo Claro</span>
                </>
              )}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {theme === 'dark' ? 'Escuro' : 'Claro'}
            </span>
          </button>

          <button
            onClick={() => {
              clearAuthToken();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {route === '/' && <PatientsView onSelectPatient={(id) => navigate(`/pacientes/${id}`)} />}
        {isPatientDetail && patientId && (
          <PatientDetailView patientId={patientId} onBack={() => navigate('/')} />
        )}
        {route === '/escalas' && <ScalesCatalogView />}
        {route === '/configuracoes' && <SettingsView onUserUpdated={setCurrentUser} />}
      </main>
    </div>
  );
}

/* ==========================================
   1. LOGIN VIEW
   ========================================== */
function LoginView({ onSuccess }: { onSuccess: (user: any) => void }) {
  const { theme, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!name.trim()) {
        setError('Por favor, informe seu nome completo profissional.');
        return;
      }
      if (password.length < 8) {
        setError('A senha deve conter no mínimo 8 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        });

        if (!res.ok) {
          setError(res.data?.error || 'Erro ao criar conta.');
          return;
        }

        if (res.data?.token) {
          setAuthToken(res.data.token);
          onSuccess(res.data.user);
        }
      } catch {
        setError('Erro de conexão com o backend.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login normal
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
          totpToken: totpToken.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setError(res.data?.error || 'Credenciais inválidas.');
        return;
      }

      if (res.data?.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      if (res.data?.token) {
        setAuthToken(res.data.token);
        onSuccess(res.data.user);
      }
    } catch {
      setError('Erro de conexão com o backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          type="button"
          className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg flex items-center gap-2 text-xs font-medium"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-600" />}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-950/50">
            Ψ
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Prontuário Digital Clínico
          </h1>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            {isRegister
              ? 'Cadastro de Conta da Terapeuta • LGPD'
              : 'Acesso Exclusivo da Profissional • LGPD & AES-256'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Completo Profissional
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dra. Maria Clara Silva"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500"
              />
            </div>
          )}

          {!requires2FA ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Profissional</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isRegister ? 'Criar Senha (mín. 8 caracteres)' : 'Senha'}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Sua senha de acesso'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirme a Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a mesma senha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500"
                  />
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-teal-300 mb-1">
                Código 2FA (6 dígitos do Autenticador)
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-teal-600 rounded-xl px-3.5 py-2.5 text-center tracking-widest text-lg font-mono text-teal-300 focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/40 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading
              ? 'Processando...'
              : isRegister
              ? 'Criar Conta & Entrar'
              : requires2FA
              ? 'Confirmar 2FA'
              : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
          >
            {isRegister
              ? 'Já possui uma conta? Clique para entrar'
              : 'Primeiro acesso? Criar nova conta de terapeuta'}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Servidor local conectado na porta 3333 • Criptografia ativa
        </p>
      </div>
    </div>
  );
}

/* ==========================================
   2. PATIENTS VIEW (BIBLIOTECA)
   ========================================== */
function PatientsView({ onSelectPatient }: { onSelectPatient: (id: string) => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ATIVO');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New patient inputs
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/pacientes?q=${encodeURIComponent(q)}&status=${statusFilter}`);
    if (res.ok) setPatients(res.data?.patients || []);
    setLoading(false);
  }, [q, statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch('/pacientes', {
      method: 'POST',
      body: JSON.stringify({ fullName: name, birthDate, email, phone, notes }),
    });

    if (res.ok) {
      setModalOpen(false);
      setName('');
      setBirthDate('');
      setEmail('');
      setPhone('');
      setNotes('');
      fetchPatients();
    } else {
      alert(res.data?.error || 'Erro ao criar paciente.');
    }
    setSaving(false);
  };

  const calcAge = (birth: string) => {
    if (!birth) return null;
    const [y, m, d] = birth.split('-').map(Number);
    const b = new Date(y, m - 1, d);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Biblioteca de Pacientes
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-950 text-teal-400 border border-teal-800/60">
              {patients.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fichas individuais, prontuários, notas clínicas de sessão e questionários.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-teal-950/40 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Paciente
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome do paciente..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {['ATIVO', 'ARQUIVADO', 'TODOS'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === s ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'ATIVO' ? 'Ativos' : s === 'ARQUIVADO' ? 'Arquivados' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Carregando pacientes...</div>
      ) : patients.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
          Nenhum paciente encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => {
            const age = calcAge(p.birthDate);
            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/60 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white hover:text-teal-300 truncate">
                      {p.fullName}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Nasc: {p.birthDate.split('-').reverse().join('/')} {age !== null && `• ${age} anos`}
                    </p>
                  </div>
                  {p.status === 'ARQUIVADO' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                      Arquivado
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <strong>{p.totalSessions}</strong> sessões
                  </span>
                  {p.lastSessionDate && (
                    <span className="text-[11px] text-slate-500">
                      Última: {p.lastSessionDate.split('-').reverse().join('/')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Paciente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white">Cadastrar Paciente</h2>
            <p className="text-xs text-slate-400">
              Nome Completo e Data de Nascimento são obrigatórios. O ID é gerado automaticamente.
            </p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">E-mail (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Telefone (Opcional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Notas Cadastrais (AES-256)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
                >
                  {saving ? 'Salvando...' : 'Salvar com Segurança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   3. PATIENT DETAIL VIEW (8 ABAS + IA DUAL)
   ========================================== */
function PatientDetailView({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const { theme } = useTheme();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [evolutionByScale, setEvolutionByScale] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [loading, setLoading] = useState(true);

  // Modal Sessão IA
  const [sessModal, setSessModal] = useState(false);
  const [sessDate, setSessDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessTime, setSessTime] = useState(() => new Date().toTimeString().substring(0, 5));
  const [sessStatus, setSessStatus] = useState('REALIZADA');
  const [transcript, setTranscript] = useState('');
  const [genNote, setGenNote] = useState('');
  const [genRecord, setGenRecord] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [savingSess, setSavingSess] = useState(false);

  // Modal Aplicar Escala
  const [scaleModal, setScaleModal] = useState(false);
  const [scalesCatalog, setScalesCatalog] = useState<any[]>([]);
  const [selectedScale, setSelectedScale] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Anamnese
  const [anamnese, setAnamnese] = useState<any>({});
  const [savingAnamnese, setSavingAnamnese] = useState(false);

  // Histórico de versões
  const [versionModal, setVersionModal] = useState(false);
  const [versionItems, setVersionItems] = useState<any[]>([]);
  const [versionTitle, setVersionTitle] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pRes, sRes, aRes] = await Promise.all([
      apiFetch(`/pacientes/${patientId}`),
      apiFetch(`/pacientes/${patientId}/sessoes`),
      apiFetch(`/escalas/paciente/${patientId}`),
    ]);

    if (pRes.ok) setPatient(pRes.data?.patient);
    if (sRes.ok) setSessions(sRes.data?.sessions || []);
    if (aRes.ok) {
      setAssignments(aRes.data?.assignments || []);
      setEvolutionByScale(aRes.data?.evolutionByScale || {});
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'anamnese') {
      apiFetch(`/pacientes/${patientId}/anamnese`).then((res) => {
        if (res.ok && res.data?.anamnesis?.data) setAnamnese(res.data.anamnesis.data);
      });
    }
  }, [activeTab, patientId]);

  const handleGenerateAI = async () => {
    if (!transcript.trim()) return;
    setAiLoading(true);
    const res = await apiFetch('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ rawContent: transcript, sessionDate: sessDate }),
    });
    if (res.ok) {
      setGenNote(res.data?.sessionNote || '');
      setGenRecord(res.data?.medicalRecordEntry || '');
    } else {
      alert(res.data?.error || 'Erro na IA');
    }
    setAiLoading(false);
  };

  const handleSaveSession = async () => {
    setSavingSess(true);
    const res = await apiFetch(`/pacientes/${patientId}/sessoes`, {
      method: 'POST',
      body: JSON.stringify({
        sessionDate: sessDate,
        sessionTime: sessTime,
        status: sessStatus,
        rawNotes: transcript,
        sessionNote: genNote,
        medicalRecordEntry: genRecord,
      }),
    });

    if (res.ok) {
      setSessModal(false);
      setTranscript('');
      setGenNote('');
      setGenRecord('');
      loadData();
    } else {
      alert(res.data?.error || 'Erro ao salvar');
    }
    setSavingSess(false);
  };

  const handleApplyScale = async () => {
    const res = await apiFetch('/escalas/aplicar', {
      method: 'POST',
      body: JSON.stringify({ patientId, instrumentId: selectedScale }),
    });
    if (res.ok) {
      setGeneratedLink(res.data?.linkUrl);
      loadData();
    }
  };

  const handleSaveAnamnese = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAnamnese(true);
    const res = await apiFetch(`/pacientes/${patientId}/anamnese`, {
      method: 'POST',
      body: JSON.stringify({ data: anamnese }),
    });
    if (res.ok) alert('Anamnese salva com criptografia AES-256!');
    setSavingAnamnese(false);
  };

  if (loading || !patient) {
    return <div className="py-20 text-center text-xs text-slate-500">Carregando ficha...</div>;
  }

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: Users },
    { id: 'sessoes', label: `Sessões (${sessions.length})`, icon: Calendar },
    { id: 'prontuario', label: 'Prontuário', icon: FileText },
    { id: 'notas', label: 'Notas de Sessão', icon: ClipboardList },
    { id: 'anamnese', label: 'Anamnese', icon: FileSpreadsheet },
    { id: 'escalas', label: `Escalas (${assignments.length})`, icon: ClipboardList },
    { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
    { id: 'documentos', label: 'Exportações', icon: Download },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar à Biblioteca
      </button>

      {/* Header Ficha */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{patient.fullName}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/60 font-medium">
              {patient.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Nasc: {patient.birthDate.split('-').reverse().join('/')} • {patient.email || 'Sem e-mail'} • {patient.phone || 'Sem telefone'}
          </p>
        </div>

        <button
          onClick={() => setSessModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-950/40 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Sessão
        </button>
      </div>

      {/* Abas */}
      <div className="border-b border-slate-800 flex overflow-x-auto gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-teal-500 text-teal-400 bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ABA 1: VISÃO GERAL */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Total de Atendimentos</p>
              <p className="text-2xl font-bold text-white mt-1">{sessions.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Escalas Aplicadas</p>
              <p className="text-2xl font-bold text-white mt-1">{assignments.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">Anamnese Estruturada</p>
              <p className="text-sm font-semibold text-teal-400 mt-2">
                {patient.hasAnamnesis ? '✓ Preenchida' : 'Pendente'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: SESSÕES */}
      {activeTab === 'sessoes' && (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">
                  Sessão em {s.sessionDate.split('-').reverse().join('/')} ({s.status})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-bold text-teal-400 uppercase">Prontuário</span>
                  <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">
                    {s.medicalRecordEntry?.content || '—'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-bold text-amber-400 uppercase">Nota Interna</span>
                  <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">
                    {s.sessionNote?.content || '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA 3: PRONTUÁRIO OFICIAL (SEM NOTAS INTERNAS) */}
      {activeTab === 'prontuario' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Prontuário Psicológico Oficial</h2>
              <p className="text-[11px] text-slate-400">
                Garantia estrita: As notas clínicas internas NUNCA são anexadas ao prontuário.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {sessions.map((s) => (
              <div key={s.id} className="border-l-2 border-teal-500 pl-4 py-1 space-y-1">
                <span className="text-xs font-bold text-teal-400">
                  {s.sessionDate.split('-').reverse().join('/')} — {s.status}
                </span>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {s.medicalRecordEntry?.content || 'Sem registro formal.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 4: NOTAS DE SESSÃO */}
      {activeTab === 'notas' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-amber-400">Notas de Sessão (Uso Interno)</h2>
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-xs font-bold text-amber-400">
                  Nota Clínica de {s.sessionDate.split('-').reverse().join('/')}
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {s.sessionNote?.content || 'Sem nota cadastrada.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 5: ANAMNESE */}
      {activeTab === 'anamnese' && (
        <form onSubmit={handleSaveAnamnese} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Anamnese Clínica</h2>
            <button
              type="submit"
              disabled={savingAnamnese}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
            >
              {savingAnamnese ? 'Salvando...' : 'Salvar Anamnese'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Demanda Principal</label>
              <textarea
                rows={3}
                value={anamnese.demandaPrincipal || ''}
                onChange={(e) => setAnamnese({ ...anamnese, demandaPrincipal: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Histórico de Saúde</label>
              <textarea
                rows={3}
                value={anamnese.historicoSaude || ''}
                onChange={(e) => setAnamnese({ ...anamnese, historicoSaude: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sono e Rotina</label>
              <textarea
                rows={3}
                value={anamnese.sono || ''}
                onChange={(e) => setAnamnese({ ...anamnese, sono: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Objetivos Terapêuticos</label>
              <textarea
                rows={3}
                value={anamnese.objetivosTerapeuticos || ''}
                onChange={(e) => setAnamnese({ ...anamnese, objetivosTerapeuticos: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
          </div>
        </form>
      )}

      {/* ABA 6: ESCALAS */}
      {activeTab === 'escalas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Escalas Aplicadas</h2>
            <button
              onClick={() => {
                setGeneratedLink(null);
                apiFetch('/escalas').then((res) => {
                  if (res.ok && res.data?.scales) {
                    setScalesCatalog(res.data.scales);
                    if (res.data.scales.length > 0) setSelectedScale(res.data.scales[0].id);
                  }
                });
                setScaleModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Aplicar Escala
            </button>
          </div>

          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white">
                    {a.instrumentAcronym} — {a.instrumentName}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Status: <strong className="text-teal-400">{a.status}</strong>
                  </p>
                </div>
                {a.status === 'RESPONDIDO' && a.response ? (
                  <div className="text-right">
                    <p className="text-xs font-bold text-teal-400">{a.response.score} pontos</p>
                    <p className="text-[11px] text-slate-300">{a.response.classification}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/responder/${a.secureToken}`;
                      navigator.clipboard.writeText(url);
                      alert('Link copiado!');
                    }}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 7: EVOLUÇÃO GRÁFICA */}
      {activeTab === 'evolucao' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Evolução Longitudinal por Escala
          </h2>

          {Object.keys(evolutionByScale).length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Ainda não há aplicações respondidas para gerar gráficos.
            </p>
          ) : (
            Object.entries(evolutionByScale).map(([acronym, item]: any) => (
              <div key={acronym} className="space-y-2">
                <span className="text-xs font-bold text-teal-400">{acronym} — {item.name}</span>
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={item.dataPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} />
                      <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#14b8a6"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#0d9488' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ABA 8: EXPORTAÇÕES */}
      {activeTab === 'documentos' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-400" />
            Exportar Histórico de Atendimentos em Excel
          </h2>
          <p className="text-xs text-slate-400">
            Exporta as datas de atendimento em planilha estruturada XLSX para declarações ou relatórios.
          </p>
          <a
            href={`/api/exportar/historico?patientId=${patient.id}&format=excel`}
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Planilha Excel (XLSX)
          </a>
        </div>
      )}

      {/* MODAL ADICIONAR SESSÃO COM IA DUAL */}
      {sessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400" />
                Registrar Atendimento Clínico
              </h3>
              <button onClick={() => setSessModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Data</label>
                <input
                  type="date"
                  value={sessDate}
                  onChange={(e) => setSessDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Situação</label>
                <select
                  value={sessStatus}
                  onChange={(e) => setSessStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="REALIZADA">Realizada</option>
                  <option value="FALTA">Falta</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-300 font-medium">
                  Transcrição ou Anotações da Sessão
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading || !transcript.trim()}
                  className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  {aiLoading ? 'Processando IA...' : 'Gerar com IA'}
                </button>
              </div>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Cole aqui o áudio transcrito ou suas notas..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-amber-400">1. Nota de Sessão (Interna)</span>
                <textarea
                  rows={6}
                  value={genNote}
                  onChange={(e) => setGenNote(e.target.value)}
                  placeholder="Texto da nota clínica detalhada..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-teal-400">2. Registro de Prontuário (Oficial)</span>
                <textarea
                  rows={6}
                  value={genRecord}
                  onChange={(e) => setGenRecord(e.target.value)}
                  placeholder="Texto formal e sintético do prontuário..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSessModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSession}
                disabled={savingSess}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
              >
                {savingSess ? 'Salvando...' : 'Aprovar e Salvar Atendimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APLICAR ESCALA */}
      {scaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Aplicar Escala ao Paciente</h3>
            {!generatedLink ? (
              <div className="space-y-3">
                <select
                  value={selectedScale}
                  onChange={(e) => setSelectedScale(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {scalesCatalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.acronym} — {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleApplyScale}
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                >
                  Gerar Link Seguro (256 bits)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-emerald-400">Link exclusivo gerado com sucesso!</p>
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-slate-300 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert('Copiado!');
                    setScaleModal(false);
                  }}
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
                >
                  Copiar Link e Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   4. SCALES CATALOG VIEW
   ========================================== */
function ScalesCatalogView() {
  const [scales, setScales] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/escalas').then((res) => {
      if (res.ok) setScales(res.data?.scales || []);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Biblioteca de Escalas e Questionários
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Instrumentos validados e autorizados para uso clínico livre.
        </p>
      </div>

      <div className="space-y-4">
        {scales.map((s) => (
          <div key={s.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-950 text-teal-300 font-mono">
                {s.acronym}
              </span>
              <h2 className="text-sm font-bold text-white">{s.name}</h2>
            </div>
            <p className="text-xs text-slate-300">{s.description}</p>
            <div className="pt-2 text-[11px] text-slate-400">
              <strong>Autores:</strong> {s.authors} • <strong>Condições:</strong> {s.usageConditions}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================
   5. SETTINGS VIEW (CONFIGURAÇÕES & AUDITORIA)
   ========================================== */
function SettingsView({ onUserUpdated }: { onUserUpdated?: (user: any) => void }) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<any>({ therapistName: '', crp: '', clinicName: '' });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Perfil (Nome e E-mail de Login)
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Segurança (Alteração de Senha)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Configurações Profissionais
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    apiFetch('/configuracoes').then((res) => {
      if (res.ok) {
        if (res.data?.settings) setSettings(res.data.settings);
        if (res.data?.auditLogs) setAuditLogs(res.data.auditLogs);
        if (res.data?.user) {
          setProfileName(res.data.user.name || '');
          setProfileEmail(res.data.user.email || '');
        }
      }
    });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      if (res.ok && res.data?.token) {
        setAuthToken(res.data.token);
        if (res.data.user && onUserUpdated) {
          onUserUpdated(res.data.user);
        }
        setProfileMsg({ text: 'Perfil e e-mail atualizados com sucesso!', isError: false });
      } else {
        setProfileMsg({ text: res.data?.error || 'Erro ao atualizar dados de acesso.', isError: true });
      }
    } catch {
      setProfileMsg({ text: 'Falha de comunicação com o servidor.', isError: true });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!currentPassword) {
      setPasswordMsg({ text: 'Informe a senha atual.', isError: true });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'A nova senha deve ter no mínimo 8 caracteres.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'As novas senhas digitadas não conferem.', isError: true });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok && res.data?.token) {
        setAuthToken(res.data.token);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ text: 'Senha alterada com sucesso! Suas outras sessões foram desconectadas.', isError: false });
      } else {
        setPasswordMsg({ text: res.data?.error || 'Erro ao alterar senha.', isError: true });
      }
    } catch {
      setPasswordMsg({ text: 'Falha de comunicação com o servidor.', isError: true });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const res = await apiFetch('/configuracoes', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsMsg({ text: 'Dados profissionais atualizados com sucesso!', isError: false });
      } else {
        setSettingsMsg({ text: res.data?.error || 'Erro ao salvar dados profissionais.', isError: true });
      }
    } catch {
      setSettingsMsg({ text: 'Falha de comunicação com o servidor.', isError: true });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Configurações & Sigilo</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gerencie seus dados de acesso, preferências visuais, dados clínicos e trilha LGPD.</p>
      </div>

      {/* Aparência da Interface */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-teal-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            Aparência da Interface
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize o tema visual do sistema clínico conforme sua preferência de iluminação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/40'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 shrink-0 mt-0.5">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white">Modo Claro (Branco)</p>
                {theme === 'light' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-600 text-white">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Fundo claro clínico com alto contraste para ambientes iluminados durante o consultório.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/40'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400 shrink-0 mt-0.5">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white">Modo Escuro</p>
                {theme === 'dark' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-600 text-white">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Tons profundos de ardósia para redução da fadiga ocular em atendimentos prolongados.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Meus Dados de Acesso (Nome e E-mail) */}
      <form onSubmit={handleUpdateProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-teal-400" />
            Meus Dados de Acesso (Conta do Usuário)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Atualize o nome de identificação e o e-mail utilizado para fazer login no sistema.
          </p>
        </div>

        {profileMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              profileMsg.isError
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                : 'bg-teal-950/40 text-teal-300 border-teal-800/50'
            }`}
          >
            {profileMsg.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Ex: Dra. Ana Paula Silva"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-mail de Login</label>
            <input
              type="email"
              required
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              placeholder="Ex: seu-email@dominio.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          {savingProfile ? 'Salvando...' : 'Atualizar Dados de Acesso'}
        </button>
      </form>

      {/* Alteração de Senha */}
      <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-400" />
            Segurança & Alteração de Senha
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Altere sua senha de acesso. Por segurança, ao alterar a senha, todas as outras sessões ativas serão desconectadas.
          </p>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              passwordMsg.isError
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                : 'bg-teal-950/40 text-teal-300 border-teal-800/50'
            }`}
          >
            {passwordMsg.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Senha Atual</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nova Senha (min. 8 car.)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha forte"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          {savingPassword ? 'Alterando senha...' : 'Alterar Senha'}
        </button>
      </form>

      {/* Dados Profissionais para Laudos e Receituários */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-400" />
            Dados Profissionais (Cabeçalho & Rodapé de Laudos)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Estes dados aparecem nas impressões, atestados e exportações de relatórios clínicos.
          </p>
        </div>

        {settingsMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              settingsMsg.isError
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                : 'bg-teal-950/40 text-teal-300 border-teal-800/50'
            }`}
          >
            {settingsMsg.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span>{settingsMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome Profissional</label>
            <input
              type="text"
              value={settings.therapistName || ''}
              onChange={(e) => setSettings({ ...settings, therapistName: e.target.value })}
              placeholder="Ex: Dra. Juliana Souza"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">CRP</label>
            <input
              type="text"
              value={settings.crp || ''}
              onChange={(e) => setSettings({ ...settings, crp: e.target.value })}
              placeholder="Ex: 06/123456"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Clínica / Consultório (Opcional)</label>
            <input
              type="text"
              value={settings.clinicName || ''}
              onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
              placeholder="Ex: Clínica Integrar"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          {savingSettings ? 'Salvando...' : 'Salvar Dados Profissionais'}
        </button>
      </form>

      {/* Trilha de Auditoria LGPD */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-white">Trilha de Auditoria LGPD (Sem dados clínicos)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="pb-2">Data</th>
                <th className="pb-2">Ação</th>
                <th className="pb-2">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 text-[11px] font-mono text-slate-400">
                    {new Date(l.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2 text-teal-400 font-mono">{l.action}</td>
                  <td className="py-2 text-slate-400">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   6. ISOLATED PATIENT RESPONDER VIEW
   ========================================== */
function ResponderView({ token }: { token: string }) {
  const { theme, toggleTheme } = useTheme();
  const [scale, setScale] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/responder/${token}`).then((res) => {
      if (res.ok && res.data?.instrument) {
        setScale(res.data.instrument);
      }
      setLoading(false);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scale) return;
    if (Object.keys(answers).length < scale.items.length) {
      alert('Por favor, responda a todos os itens antes de enviar.');
      return;
    }

    const res = await apiFetch(`/responder/${token}`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });

    if (res.ok) setSubmitted(true);
    else alert('Erro ao enviar respostas.');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Carregando questionário...</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-teal-800/60 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Respostas Enviadas!</h2>
          <p className="text-xs text-slate-300">
            Muito obrigado! Suas respostas foram salvas com segurança e serão analisadas pela sua psicóloga.
          </p>
        </div>
      </div>
    );
  }

  if (!scale) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center text-rose-400 text-xs">
        Link expirado ou inválido.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 max-w-xl mx-auto space-y-6">
      <div className="flex justify-end">
        <button
          onClick={toggleTheme}
          type="button"
          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer shadow flex items-center gap-1.5 text-xs font-medium"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-teal-600" />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 uppercase">
          {scale.category}
        </span>
        <h1 className="text-lg font-bold text-white">{scale.name}</h1>
        <p className="text-xs text-slate-400">{scale.instructions}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {scale.items.map((item: any, idx: number) => (
          <div key={item.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <p className="text-xs font-semibold text-slate-200">
              {idx + 1}. {item.text}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {item.options.map((opt: any) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [item.id]: opt.value })}
                  className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-colors cursor-pointer ${
                    answers[item.id] === opt.value
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg cursor-pointer"
        >
          Enviar Respostas à Psicóloga
        </button>
      </form>
    </div>
  );
}
