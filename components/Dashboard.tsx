
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Company } from '../types';
import { Building2, Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardProps {
  companies: Company[];
}

const Dashboard: React.FC<DashboardProps> = ({ companies }) => {
  const stats = useMemo(() => {
    // 1. By State
    const byState = companies.reduce((acc, curr) => {
      acc[curr.address.state] = (acc[curr.address.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const chartDataByState = Object.entries(byState).map(([name, value]) => ({ name, value }));

    // 2. Growth Analysis (Aggregate last 3 years revenue)
    const years = [2021, 2022, 2023];
    const aggregateRevenue = years.map(y => {
      const total = companies.reduce((acc, company) => {
        const yearData = company.financialHistory.find(fh => fh.year === y);
        return acc + (yearData?.revenue || 0);
      }, 0);
      return { year: y.toString(), revenue: total };
    });

    // 3. Status Pie
    const activeCount = companies.filter(c => c.status === 'Ativa').length;
    const byStatus = [
      { name: 'Ativas', value: activeCount, color: '#10b981' },
      { name: 'Inativas/Outras', value: companies.length - activeCount, color: '#ef4444' }
    ];

    // 4. Sector Distribution
    const bySector = companies.reduce((acc, curr) => {
      acc[curr.cnaeDescription] = (acc[curr.cnaeDescription] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sectorData = Object.entries(bySector).map(([name, value]) => ({ name, value }));

    return { 
      chartDataByState, 
      aggregateRevenue, 
      activeCount, 
      byStatus,
      sectorData,
      totalCapital: companies.reduce((acc, curr) => acc + curr.capital, 0),
      avgGrowth: companies.reduce((acc, curr) => acc + curr.metrics.growth, 0) / companies.length
    };
  }, [companies]);

  const StatCard = ({ icon: Icon, label, value, subLabel, color }: any) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {subLabel && <span className="text-xs text-emerald-600 font-bold">{subLabel}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Building2} label="Base de Empresas" value={companies.length} color="bg-indigo-500" />
        <StatCard icon={TrendingUp} label="Crescimento Médio" value={`${stats.avgGrowth.toFixed(1)}%`} subLabel="+2.4%" color="bg-emerald-500" />
        <StatCard icon={DollarSign} label="Revenue Total (2023)" value={new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(stats.aggregateRevenue[2].revenue)} color="bg-blue-500" />
        <StatCard icon={Users} label="Total Empregados" value={companies.reduce((acc, c) => acc + c.metrics.employees, 0)} color="bg-violet-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Line */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex justify-between">
            Evolução de Faturamento Agregado
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Base Anual</span>
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.aggregateRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Faturamento Bruto"
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Distribution Pie */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Setores em Destaque</h3>
          <div className="h-72 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.sectorData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#3b82f6', '#10b981'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold">{stats.sectorData.length}</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Segmentos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
