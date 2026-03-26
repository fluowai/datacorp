
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
  MessageSquare
} from 'lucide-react';
import { ViewType, FilterState } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isOpen, 
  toggleSidebar,
}) => {
  const menuItems = [
    { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Painel Geral' },
    { id: 'search' as ViewType, icon: Search, label: 'Consultas CNPJ/CPF' },
    { id: 'lead_scan' as ViewType, icon: Target, label: 'Varredura de Leads' },
    { id: 'biddings' as ViewType, icon: Gavel, label: 'Licitações' },
    { id: 'whatsapp_groups' as ViewType, icon: MessageSquare, label: 'Grupos WhatsApp' },
    { id: 'analytics' as ViewType, icon: PieChart, label: 'Analytics' },
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
            <h1 className="text-slate-900 font-black text-xl leading-none">DataCorp</h1>
            <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mt-1">Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-4 pt-6 space-y-1 overflow-y-auto scrollbar-hide">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4 mb-4">Inteligência</div>
          
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group
                ${currentView === item.id 
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <item.icon size={20} className={currentView === item.id ? 'text-indigo-400' : 'group-hover:text-indigo-500'} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase mb-3">
              <History size={14} className="text-indigo-500" />
              <span>Varredura Ativa</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Consulte dados reais extraídos em tempo real da web.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
