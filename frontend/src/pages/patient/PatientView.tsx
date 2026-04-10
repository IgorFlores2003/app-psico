import React from 'react';
import { 
  ClipboardCheck, 
  MessageCircle, 
  Calendar, 
  ArrowRight,
  User,
  Bell
} from 'lucide-react';
import QuestionnaireCard from '../../components/patient/QuestionnaireCard';

const PatientView: React.FC = () => {
  const activeQuestionnaires = [
    { 
      id: 1, 
      title: 'Auto-avaliação Semanal', 
      description: 'Como está seu humor hoje? Responda em 2 min.',
      status: 'Pendente',
      dueDate: 'Expira hoje'
    },
    { 
      id: 2, 
      title: 'Diário de Pensamentos', 
      description: 'Registre os momentos marcantes da sua semana.',
      status: 'Pendente',
      dueDate: 'Expira em 2 dias'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Mobile Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-12 pb-6 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/20 flex items-center justify-center text-white">
              <User size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Paciente</p>
              <h1 className="text-xl font-bold text-slate-800">Olá, Marcos</h1>
            </div>
          </div>
          <button className="p-3 bg-slate-100 rounded-2xl text-slate-500 relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        </div>

        <div className="bg-brand-500 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/30">
          <p className="text-brand-100 text-sm font-medium mb-1">Próxima Consulta</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-brand-200" />
              <span className="text-lg font-bold">Terça-feira, 14:00</span>
            </div>
            <button className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-white/30 transition-all">
              Confirmar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-slate-800">Questionários</h2>
            <span className="text-brand-600 text-xs font-bold uppercase">Ver Todos</span>
          </div>
          
          <div className="space-y-4">
            {activeQuestionnaires.map((q) => (
              <QuestionnaireCard key={q.id} questionnaire={q} />
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <MessageCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">Chat com seu Psicólogo</h3>
              <p className="text-sm text-slate-500 mb-4">Você tem 2 novas mensagens não lidas.</p>
              <button className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                Abrir Chat
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex items-center justify-around px-4 z-20">
        <button className="flex flex-col items-center gap-1 text-brand-500">
          <div className="p-1 bg-brand-500/10 rounded-lg">
            <Calendar size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase">Início</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <ClipboardCheck size={20} />
          <span className="text-[10px] font-bold uppercase">Fichas</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <MessageCircle size={20} />
          <span className="text-[10px] font-bold uppercase">Mensagens</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <User size={20} />
          <span className="text-[10px] font-bold uppercase">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default PatientView;
