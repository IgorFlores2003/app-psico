import React, { useEffect, useState } from 'react';
import { User, Mail, Calendar, Trash2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

interface UserData {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {users.map((user) => (
        <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
              <User size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
              <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-3">
                <Mail size={14} className="shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <Calendar size={12} />
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                 </div>
                 <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                    <ShieldCheck size={12} />
                    Administrador
                 </div>
              </div>
            </div>
          </div>
          
          <button className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      {users.length === 0 && (
        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
          <p className="text-slate-400 font-medium italic">Nenhum administrador cadastrado.</p>
        </div>
      )}
    </div>
  );
};

export default UsersList;
