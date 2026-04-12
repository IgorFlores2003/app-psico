import React, { useEffect, useState } from 'react';
import { MoreHorizontal, Mail, Phone, Calendar, UserPlus } from 'lucide-react';
import api from '../../services/api';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  lastVisit?: string;
  status?: string;
}

interface PatientsListProps {
  refreshKey?: number;
}

export default function PatientsList({ refreshKey }: PatientsListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await api.get('/patients');
        setPatients(response.data);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium">Carregando pacientes...</p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
          <UserPlus size={32} />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-600">Nenhum paciente encontrado</p>
          <p className="text-sm">Comece cadastrando seu primeiro paciente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Paciente</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contato</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest lg:table-cell hidden">Idade</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest lg:table-cell hidden">Última Visita</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {patients.map((p) => (
            <tr key={p.id} className="hover:bg-brand-50/30 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 uppercase">
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-700">{p.name}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1 text-sm text-slate-500 font-medium">
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {p.email}
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {p.phone}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-5 lg:table-cell hidden">
                <span className="text-sm font-bold text-slate-600">{p.age} anos</span>
              </td>
              <td className="px-6 py-5 lg:table-cell hidden">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  {p.lastVisit || 'Sem registros'}
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                  p.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600' : 
                  p.status === 'Em Pausa' ? 'bg-amber-100 text-amber-600' : 
                  'bg-brand-100 text-brand-600'
                }`}>
                  {p.status || 'Ativo'}
                </span>
              </td>
              <td className="px-6 py-5 text-right">
                <button className="inline-flex items-center rounded-xl bg-white px-2.5 py-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]">
                  <MoreHorizontal size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase">Total de {patients.length} pacientes</span>
      </div>
    </div>
  );
}
