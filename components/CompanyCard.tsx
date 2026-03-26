
import React from 'react';
import { Company } from '../types';
import { MapPin, ArrowUpRight, DollarSign } from 'lucide-react';

interface CompanyCardProps {
  company: Company;
  onClick: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
  const isAtiva = company.status === 'Ativa';

  return (
    <div 
      onClick={() => onClick(company)}
      className="bg-white rounded-[1.5rem] p-7 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-pointer group active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isAtiva ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {company.status}
            </span>
            <span className="text-slate-300 text-[10px] font-mono">{company.cnpj}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
            {company.tradeName || company.legalName}
          </h3>
          <p className="text-slate-400 text-[11px] font-medium mt-1 truncate max-w-[200px] uppercase tracking-wide">
            {company.legalName}
          </p>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <ArrowUpRight size={18} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin size={14} className="text-indigo-400" />
            <span className="text-xs font-bold">{company.address.state}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <DollarSign size={14} className="text-emerald-500" />
            <span className="text-xs font-bold">
              {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(company.capital)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
