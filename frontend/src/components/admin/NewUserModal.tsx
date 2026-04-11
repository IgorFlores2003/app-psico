import React, { useState } from 'react';
import { X, User, Mail, Lock, Shield, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'paciente' | 'psicologo'>('psicologo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/users', { name, email, password, role });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setName('');
        setEmail('');
        setPassword('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        {success ? (
          <div className="p-12 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Usuário Criado!</h2>
            <p className="text-slate-500">O novo colaborador já pode acessar o sistema.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Novo Administrador</h2>
                  <p className="text-sm text-slate-400 font-medium">Cadastre um novo colaborador profissional.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      required
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Dr. Roberto Silva"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail Profissional</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      required
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="roberto@clinica.com"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                      required
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Criar Conta de Profissional'}
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default NewUserModal;
