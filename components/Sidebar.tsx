
import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  TrendingUp, 
  Star, 
  Settings, 
  Database,
  Menu,
  X,
  Building2,
  PieChart,
  Gavel,
  History,
  Target,
  Zap,
  MessageSquare,
  MapPin,
  Navigation,
  Instagram,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Bot,
  Key
} from 'lucide-react';
import { ViewType, FilterState } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  user: any;
  onLogout: () => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onInvestigate: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isOpen, 
  toggleSidebar,
  user,
  onLogout,
  searchTerm,
  setSearchTerm,
  onInvestigate
}) => {
  const menuItems = [
    { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'kanban' as ViewType, icon: Target, label: 'Pipeline de Leads' },
    { id: 'osint_search' as ViewType, icon: Search, label: 'Consulta OSINT' },
    { id: 'google_maps' as ViewType, icon: MapPin, label: 'Google Maps' },
    { id: 'instagram_search' as ViewType, icon: Instagram, label: 'Instagram Search' },
    { id: 'whatsapp_search' as ViewType, icon: MessageSquare, label: 'WhatsApp Groups' },
    { id: 'cnae_search' as ViewType, icon: Building2, label: 'Busca por CNAE' },
    { id: 'agents' as ViewType, icon: Bot, label: 'Agentes IA' },
    { id: 'analytics' as ViewType, icon: PieChart, label: 'Analytics' },
    { id: 'integrations' as ViewType, icon: Key, label: 'Integrações' },
  ];

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={toggleSidebar}
          className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full bg-white w-64 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border-r border-slate-100
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-slate-900 font-black text-xl leading-none uppercase tracking-tighter">woo<span className="text-indigo-600">sender</span></h1>
            <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mt-1">Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4 mb-4">Menu Principal</div>
          
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group mb-1
                ${currentView === item.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <item.icon size={18} className={currentView === item.id ? 'text-indigo-400' : 'group-hover:text-indigo-500'} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'Usuário'}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
