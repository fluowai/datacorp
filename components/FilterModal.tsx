
import React from 'react';
import { X, Filter, Target, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { FilterState } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, setFilters }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Filter size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Filtros Avançados</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <section>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin size={14} /> Localização Geográfica
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Todas', 'SP', 'RJ', 'PR', 'MT', 'MG'].map(uf => (
                <button
                  key={uf}
                  onClick={() => setFilters({ ...filters, state: uf })}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition-all border ${
                    filters.state === uf 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {uf === 'Todas' ? 'Brasil' : uf}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Briefcase size={14} /> Setor de Atuação (Nicho)
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
            >
              <option value="Todos">Todos os Setores</option>
              <option value="Desenvolvimento de programas">Tecnologia/Software</option>
              <option value="Transporte">Logística</option>
              <option value="cultivo">Agronegócio</option>
              <option value="Supermercados">Varejo Alimentício</option>
            </select>
          </section>

          <section>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign size={14} /> Porte / Faturamento Estimado
            </label>
            <div className="space-y-2">
              {[
                { id: 'Todas', label: 'Todos os Faturamentos' },
                { id: 'Pequena', label: 'Micro/Pequena (Até R$ 1M)' },
                { id: 'Média', label: 'Média Empresa (R$ 1M - R$ 5M)' },
                { id: 'Grande', label: 'Grande Porte (R$ 5M+)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilters({ ...filters, size: opt.id as any })}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                    filters.size === opt.id 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={() => setFilters({ sector: 'Todos', state: 'Todas', size: 'Todas' })}
            className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all"
          >
            Limpar
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
