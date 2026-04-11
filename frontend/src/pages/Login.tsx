import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedUser = await signIn({ email, password });
      
      if (loggedUser.role === 'psicologo') {
        history.push('/admin');
      } else {
        history.push('/patient');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao realizar login. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
      {/* Background blobs for premium feel */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-brand-500/10 border border-white p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex mb-6 group hover:scale-105 transition-transform duration-300">
             <img src={logoImg} alt="app-psico Logo" className="w-24 h-auto drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Bem-vindo de volta</h1>
          <p className="text-slate-500 font-medium">Gestão Psicológica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@psico.com"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium !text-black shadow-sm"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                <input 
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl py-4 pl-12 pr-12 outline-none transition-all font-medium !text-black shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-200 text-brand-500 focus:ring-brand-500 transition-all cursor-pointer" />
              <span className="text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Lembrar de mim</span>
            </label>
            <button type="button" className="text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors">Esqueci a senha</button>
          </div>

          <button 
            disabled={loading}
            type="submit"
            style={{ borderRadius: '9999px' }}
            className="group relative w-full h-[60px] bg-brand-500 rounded-full font-bold text-white shadow-lg shadow-brand-500/20 transition-all duration-300 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/40 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-lg tracking-tight">Entrar no Sistema</span>
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </button>
        </form>

        <p className="text-center mt-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
          Não tem uma conta? <Link to="/register" className="text-brand-500 hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
