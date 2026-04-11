import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  LayoutDashboard, 
  Send, 
  Settings, 
  LogOut,
  ChevronRight,
  Search,
  Plus,
  Shield
} from 'lucide-react';
import PatientsList from '../../components/admin/PatientsList';
import DashboardStats from '../../components/admin/DashboardStats';
import NewPatientModal from '../../components/admin/NewPatientModal';
import UsersList from '../../components/admin/UsersList';
import NewUserModal from '../../components/admin/NewUserModal';
import { useAuth } from '../../contexts/AuthContext';
import logoImg from '../../assets/logo.png';

const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'patients', label: 'Pacientes', icon: <Users size={20} /> },
    { id: 'users', label: 'Usuários', icon: <Shield size={20} /> },
    { id: 'forms', label: 'Formulários', icon: <FileText size={20} /> },
    { id: 'send', label: 'Enviar Questionário', icon: <Send size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-brand-900 text-white flex flex-col p-6 shadow-xl z-50 transition-all duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 mb-12">
          <img src={logoImg} alt="app-psico Logo" className="w-10 h-10 object-contain brightness-0 invert" />
          <h1 className="text-xl font-bold tracking-tight">app-psico <span className="text-brand-400 font-medium text-sm">Admin</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-brand-300 hover:bg-brand-800 hover:text-white'}`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-brand-800 mt-6 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand-300 hover:bg-brand-800 hover:text-white transition-all">
            <Settings size={20} />
            <span className="font-medium text-sm">Configurações</span>
          </button>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative w-full">
        {/* Header */}
        <header className="h-20 bg-white/80 border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2.5 bg-slate-100 rounded-xl text-slate-600 hover:bg-brand-50 hover:text-brand-500 transition-all active:scale-95"
            >
              <LayoutDashboard size={20} />
            </button>
            
            <div className="hidden sm:flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl lg:w-96 group focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <Search size={18} className="text-slate-400 group-focus-within:text-brand-500" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-transparent border-none focus:outline-none text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-brand-600 font-bold overflow-hidden shadow-sm hover:ring-2 hover:ring-brand-500/20 transition-all active:scale-95"
            >
              AD
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute top-12 right-0 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrador</p>
                    <p className="text-sm font-bold text-slate-700 truncate">admin@psico.com</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-left">
                    <Settings size={16} />
                    Configurações
                  </button>
                  <button 
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Sair da conta
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-8 pb-12 w-full max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" key={`dash-${refreshKey}`}>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-800">Bem-vindo, Administrador</h2>
                <p className="text-slate-500 font-medium">Resumo do dia: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
              </div>
              <DashboardStats />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-64 lg:h-80 flex items-center justify-center text-slate-400 font-medium italic text-center px-8">
                    Análise Mensal de Engajamento
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-64 lg:h-80 flex items-center justify-center text-slate-400 font-medium italic text-center px-8">
                    Evolução de Respostas
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden" key={`list-${refreshKey}`}>
               <div className="mb-6 lg:mb-8 flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-slate-800">Lista de Pacientes</h2>
                  <p className="text-slate-500 font-medium text-sm lg:text-base">Visualize todos os pacientes cadastrados.</p>
              </div>
              <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
                <PatientsList />
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" key={`users-${refreshKey}`}>
               <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
                    <p className="text-slate-500 font-medium text-sm lg:text-base">Administradores e colaboradores com acesso ao sistema.</p>
                  </div>
                  <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="bg-brand-500 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95 whitespace-nowrap"
                  >
                    <Plus size={18} />
                    Novo Usuário
                  </button>
              </div>
              <UsersList key={refreshKey} />
            </div>
          )}

          {(activeTab === 'forms' || activeTab === 'send') && (
            <div className="h-[50vh] lg:h-[60vh] flex items-center justify-center text-slate-400 font-medium bg-white rounded-3xl border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-500">
               {activeTab === 'forms' ? 'Gerenciador de Formulários' : 'Envio de Questionários'}
            </div>
          )}
        </div>
      </main>

      <NewPatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleRefresh}
      />

      <NewUserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default AdminDashboard;
