import React, { useEffect, useState } from 'react';
import { Users, FileCheck, Clock, TrendingUp } from 'lucide-react';
import api from '../../services/api';

interface Stats {
  totalPatients: number;
  formsAnswered: number;
  pendingForms: number;
  returnRate: string;
}

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await api.get('/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }
    loadStats();
  }, []);

  const statsList = [
    { title: 'Total Pacientes', value: stats?.totalPatients || 0, icon: <Users className="text-blue-600" />, trend: '---', color: 'bg-blue-50' },
    { title: 'Forms Respondidos', value: stats?.formsAnswered || 0, icon: <FileCheck className="text-emerald-600" />, trend: '---', color: 'bg-emerald-50' },
    { title: 'Pendentes', value: stats?.pendingForms || 0, icon: <Clock className="text-amber-600" />, trend: '---', color: 'bg-amber-50' },
    { title: 'Taxa de Retorno', value: stats?.returnRate || '0%', icon: <TrendingUp className="text-purple-600" />, trend: '---', color: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsList.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-95 duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{stat.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-2">{stat.trend}</p>
          </div>
        </div>
      ))}
    </div>
  );
};


export default DashboardStats;
