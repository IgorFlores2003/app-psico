import React, { useState } from 'react';
import { User, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { IonPage, IonContent, IonButton, useIonRouter, IonRouterLink } from '@ionic/react';
import api from '../services/api';
import logoImg from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const { signIn } = useAuth();
  const router = useIonRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/register', { name, email, password, role: 'psicologo' });
      
      // Auto-Sign In
      await signIn({ email, password });
      
      // Redirect immediately to dashboard
      router.push('/admin', 'forward', 'replace');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao realizar cadastro. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="flex flex-col items-center justify-center min-h-full bg-slate-50 font-sans overflow-x-hidden py-12 px-4 relative">
          {/* Background blobs for premium feel */}
          <div className="fixed top-0 -left-4 w-72 h-72 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"></div>
          <div className="fixed top-0 -right-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
          <div className="fixed -bottom-8 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>

          <div className="relative w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-brand-500/10 border border-white p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <img src={logoImg} alt="app-psico Logo" className="w-24 h-auto" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Crie sua conta</h1>
              <p className="text-slate-500 font-medium italic">Comece a gerenciar sua clínica hoje</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      required
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium !text-black shadow-sm"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      required
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
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
                      placeholder="Escolha uma senha forte"
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

              <button 
                disabled={loading}
                type="submit"
                className="flex w-full justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="text-lg tracking-tight">Criar Conta Profissional</span>
                    <LogIn size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center mt-10 text-slate-400 font-bold text-xs uppercase tracking-widest gap-1">
              Já tem conta? <IonRouterLink routerLink="/login" className="text-brand-500 hover:underline cursor-pointer">Fazer Login</IonRouterLink>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
