import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, Calendar, UserPlus, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/patients', {
        name,
        email,
        password,
        phone,
        age: Number(age),
        clinical_notes: clinicalNotes
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setAge('');
        setClinicalNotes('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao cadastrar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay cosmético */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 max-h-[90vh] flex flex-col">
        {success ? (
          <div className="p-20 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Paciente Cadastrado!</h2>
            <p className="text-slate-500 text-lg">O perfil e a conta de acesso foram criados com sucesso.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-8 lg:p-10 border-b border-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Novo Paciente</h2>
                  <p className="text-slate-500 font-medium text-sm">Crie a conta de acesso e o perfil clínico do paciente.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors hover:bg-slate-100"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              {/* Seção 1: Acesso ao Sistema */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Lock size={16} />
                   </div>
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Credenciais de Acesso</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail para Login</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input 
                        required
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="paciente@exemplo.com"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha Inicial</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input 
                        required
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Perfil do Paciente */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                      <User size={16} />
                   </div>
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Informações Pessoais</h3>
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      required
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome do Paciente"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Idade</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input 
                        required
                        type="number" 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Ex: 25"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Observações Clínicas (Opcional)</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-6 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <textarea 
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Breve resumo clínico ou motivo da consulta..."
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-slate-700 h-32 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="pt-6">
                <button 
                  disabled={loading}
                  type="submit"
                  className="flex w-full justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                     <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus size={20} className="mr-2" />
                      Finalizar Cadastro
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default NewPatientModal;
