
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CompanyCard from './components/CompanyCard';
import Dashboard from './components/Dashboard';
import FilterModal from './components/FilterModal';
import { Company, ViewType, FilterState, SearchMode, LeadScanParams, Lead, WhatsAppGroup } from './types';
import { MOCK_COMPANIES } from './mockData';
import { 
  Search, X, MapPin, Globe, ShieldCheck, Loader2, ArrowRight, DatabaseZap, Gavel, 
  User, Target, Briefcase, Users, Navigation, Phone, Info, Link2, Zap, 
  Scale, Share2, Newspaper, AlertTriangle, CheckCircle, FileText,
  Hash, Building2, Download, Coins, SearchCode, Store, Check, ExternalLink,
  Calendar, Landmark, FileSearch, MessageSquare, Instagram, Facebook, Link as LinkIcon,
  PieChart as PieIcon, UserPlus
} from 'lucide-react';
import { fetchPublicDataReport, scanCompaniesStream, fetchBiddingsStream, fetchWhatsAppGroupsStream } from './services/geminiService';

interface Bidding {
  title: string;
  org: string;
  modality: string;
  value: string;
  date: string;
  location: string;
  link: string;
  desc: string;
}

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [searchMode, setSearchMode] = useState<SearchMode>('CNPJ');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leadParams, setLeadParams] = useState<LeadScanParams>({ 
    uf: '', city: '', cnae: '', cep: '', limit: 10, minCapital: ''
  });
  
  const [selectedItem, setSelectedItem] = useState<{name: string, identifier: string, type: 'EMPRESA' | 'PESSOA'} | null>(null);
  const [publicDataReport, setPublicDataReport] = useState<{text: string, sources: any[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [biddings, setBiddings] = useState<Bidding[]>([]);
  const [biddingSearch, setBiddingSearch] = useState('');

  const [waGroups, setWaGroups] = useState<WhatsAppGroup[]>([]);
  const [waSearch, setWaSearch] = useState('');

  // Lead Parser
  useEffect(() => {
    if (currentView !== 'lead_scan') return;
    const leadBlocks = streamingText.split('---LEAD_START---').slice(1);
    const parsedLeads: Lead[] = leadBlocks.map(block => {
      const cleanBlock = block.split('---LEAD_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().startsWith(key.toUpperCase()));
        return line ? line.substring(line.indexOf(':') + 1).trim() : '';
      };
      return {
        sourceName: findValue('FONTE_NOME') || 'Web Search',
        name: findValue('EMPRESA'),
        cnpj: findValue('CNPJ'),
        address: findValue('CIDADE'),
        partners: findValue('SOCIOS').split(',').map(s => s.trim()).filter(s => s),
        phones: findValue('TELEFONES').split(',').map(p => p.trim()).filter(p => p),
        googleBusinessLink: findValue('GMN'),
        sourceLink: findValue('FONTE'),
        activity: findValue('ATIVIDADE'),
        capitalSocial: findValue('CAPITAL')
      };
    }).filter(l => l.name);
    setLeads(parsedLeads);
  }, [streamingText, currentView]);

  // Bidding Parser
  useEffect(() => {
    if (currentView !== 'biddings') return;
    const bidBlocks = streamingText.split('---BID_START---').slice(1);
    const parsedBids: Bidding[] = bidBlocks.map(block => {
      const cleanBlock = block.split('---BID_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().startsWith(key.toUpperCase()));
        return line ? line.substring(line.indexOf(':') + 1).trim() : '';
      };
      return {
        title: findValue('TITULO'),
        org: findValue('ORGAO'),
        modality: findValue('MODALIDADE'),
        value: findValue('VALOR'),
        date: findValue('DATA'),
        location: findValue('LOCAL'),
        link: findValue('LINK'),
        desc: findValue('DESC')
      };
    }).filter(b => b.title);
    setBiddings(parsedBids);
  }, [streamingText, currentView]);

  // WhatsApp Groups Parser
  useEffect(() => {
    if (currentView !== 'whatsapp_groups') return;
    const groupBlocks = streamingText.split('---GROUP_START---').slice(1);
    const parsedGroups: WhatsAppGroup[] = groupBlocks.map(block => {
      const cleanBlock = block.split('---GROUP_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().startsWith(key.toUpperCase()));
        return line ? line.substring(line.indexOf(':') + 1).trim() : '';
      };
      return {
        name: findValue('NOME'),
        platform: findValue('PLATAFORMA') as any,
        link: findValue('LINK'),
        description: findValue('DESC'),
        foundAt: findValue('ORIGEM')
      };
    }).filter(g => g.name && g.link);
    setWaGroups(parsedGroups);
  }, [streamingText, currentView]);

  const handleRealDataConsult = async (targetIdentifier?: string, targetName?: string) => {
    const query = targetIdentifier || targetName || searchTerm;
    if (!query || query.length < 3) return;
    const identifier = targetIdentifier || (searchMode !== 'NOME' ? query : 'Busca por Nome');
    const name = targetName || (searchMode === 'NOME' ? query : 'Investigação');
    const type = searchMode === 'CPF' ? 'PESSOA' : 'EMPRESA';
    setSelectedItem({ name, identifier, type });
    setPublicDataReport(null);
    setIsSearching(true);
    try {
      const result = await fetchPublicDataReport(identifier, query, type);
      setPublicDataReport(result);
    } catch (error) {
      alert("Erro ao realizar consulta OSINT.");
    } finally { setIsSearching(false); }
  };

  const handleWaMining = async () => {
    if (!waSearch) return;
    setIsSearching(true);
    setStreamingText('');
    setWaGroups([]);
    try {
      const stream = await fetchWhatsAppGroupsStream(waSearch);
      for await (const chunk of stream) {
        setStreamingText(prev => prev + (chunk.text || ''));
      }
    } catch (error) { alert("Erro na mineração."); } finally { setIsSearching(false); }
  };

  // Added handleLeadScan to fix "Cannot find name 'handleLeadScan'" error.
  const handleLeadScan = async () => {
    setIsSearching(true);
    setStreamingText('');
    setLeads([]);
    try {
      const { uf, city, cnae, cep, limit, minCapital } = leadParams;
      const responseStream = await scanCompaniesStream(uf, city, cnae, cep, limit, minCapital);
      for await (const chunk of responseStream) {
        setStreamingText(prev => prev + (chunk.text || ''));
      }
    } catch (error) {
      console.error("Lead scan error:", error);
      alert("Erro ao realizar varredura de leads.");
    } finally {
      setIsSearching(false);
    }
  };

  const parseDossie = (text: string) => {
    const sections = {
      resumo: text.split('#SECAO_RESUMO#')[1]?.split('#SECAO_DADOS#')[0] || '',
      dados: text.split('#SECAO_DADOS#')[1]?.split('#SECAO_SOCIOS#')[0] || '',
      socios: text.split('#SECAO_SOCIOS#')[1]?.split('#SECAO_JURIDICO#')[0] || '',
      juridico: text.split('#SECAO_JURIDICO#')[1]?.split('#SECAO_SOCIAL#')[0] || '',
      social: text.split('#SECAO_SOCIAL#')[1]?.split('#SECAO_NOTICIAS#')[0] || '',
      noticias: text.split('#SECAO_NOTICIAS#')[1] || ''
    };
    const risk = sections.resumo.includes('RISCO: ALTO') ? 'alto' : sections.resumo.includes('RISCO: MÉDIO') ? 'medio' : 'baixo';
    return { sections, risk };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-['Inter']">
      <Sidebar currentView={currentView} setView={setView} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} filters={{} as any} setFilters={() => {}} />

      <main className="flex-1 lg:ml-64 p-6 lg:p-12">
        <header className="mb-10 max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">DataCorp OSINT</h1>
            <p className="text-slate-500 font-medium">Investigação corporativa e social com dados em tempo real.</p>
          </div>
          <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <input 
              type="text" 
              placeholder={`Consultar ${searchMode}...`}
              className="pl-4 pr-4 py-2 bg-slate-50 border-none outline-none rounded-xl text-sm font-bold w-full lg:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRealDataConsult()}
            />
            <button onClick={() => handleRealDataConsult()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-slate-800 transition-all">INVESTIGAR</button>
          </div>
        </header>

        {currentView === 'whatsapp_groups' && (
          <div className="space-y-8 max-w-7xl mx-auto">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <MessageSquare size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Social Lead Miner (WhatsApp)</h2>
                    <p className="text-slate-500 text-sm font-medium">Varrredura OSINT em busca de grupos de networking e comunidades.</p>
                  </div>
               </div>
               <div className="flex gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-200">
                  <input 
                    type="text" 
                    placeholder="Busque por nicho, ex: 'Agro', 'Investimentos', 'Marketing'..."
                    className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-lg font-bold placeholder:text-slate-300"
                    value={waSearch}
                    onChange={(e) => setWaSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleWaMining()}
                  />
                  <button onClick={handleWaMining} disabled={isSearching} className="bg-emerald-600 text-white px-10 rounded-2xl font-black hover:bg-emerald-500 transition-all flex items-center gap-3">
                    {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />} MINERAR
                  </button>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {waGroups.map((group, i) => (
                 <div key={i} className="bg-white p-7 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          <span className="text-[10px] font-black uppercase text-slate-500">{group.platform}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 group-hover:text-emerald-600 transition-colors">{group.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-3 leading-relaxed">{group.description}</p>
                    </div>
                    <div className="space-y-2">
                       <a href={group.link} target="_blank" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg">
                        <MessageSquare size={16} /> ENTRAR NO GRUPO
                      </a>
                      <a href={group.foundAt} target="_blank" className="w-full bg-white border border-slate-100 text-slate-400 py-3 rounded-xl font-black text-[10px] hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                        <LinkIcon size={12} /> VER ORIGEM OSINT
                      </a>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {currentView === 'lead_scan' && (
          <div className="space-y-8 max-w-7xl mx-auto">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <DatabaseZap size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Hunter de Leads Qualificados</h2>
                    <p className="text-slate-500 text-sm font-medium">Extração de dados reais com validação via Google Search.</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                  <input type="text" placeholder="UF" className="bg-slate-50 border p-3 rounded-xl font-bold text-sm" value={leadParams.uf} onChange={e => setLeadParams({...leadParams, uf: e.target.value})} />
                  <input type="text" placeholder="Cidade" className="bg-slate-50 border p-3 rounded-xl font-bold text-sm" value={leadParams.city} onChange={e => setLeadParams({...leadParams, city: e.target.value})} />
                  <input type="text" placeholder="CNAE" className="bg-slate-50 border p-3 rounded-xl font-bold text-sm" value={leadParams.cnae} onChange={e => setLeadParams({...leadParams, cnae: e.target.value})} />
                  <input type="text" placeholder="Cap. Social" className="bg-slate-50 border p-3 rounded-xl font-bold text-sm" value={leadParams.minCapital} onChange={e => setLeadParams({...leadParams, minCapital: e.target.value})} />
                  <input type="text" placeholder="CEP" className="bg-slate-50 border p-3 rounded-xl font-bold text-sm" value={leadParams.cep} onChange={e => setLeadParams({...leadParams, cep: e.target.value})} />
                  <input type="number" className="bg-slate-50 border p-3 rounded-xl font-bold text-sm" value={leadParams.limit} onChange={e => setLeadParams({...leadParams, limit: parseInt(e.target.value) || 0})} />
               </div>
               <button onClick={handleLeadScan} disabled={isSearching} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                  {isSearching ? <Loader2 className="animate-spin" /> : <Zap size={22} fill="currentColor" />}
                  {isSearching ? 'MINERANDO DADOS...' : 'INICIAR PROSPECÇÃO'}
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {leads.map((l, i) => (
                 <div key={i} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">{l.name ? l.name[0] : '?'}</div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">{l.sourceName}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-lg leading-tight mb-2">{l.name}</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{l.cnpj}</span>
                        {l.capitalSocial && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-100"><Coins size={10} /> {l.capitalSocial}</span>}
                      </div>
                      <div className="space-y-3 mb-6">
                         <div className="flex items-start gap-3">
                           <Phone size={14} className="text-emerald-500 mt-1" />
                           <span className="text-xs font-black text-slate-900">{l.phones.length > 0 && l.phones[0] !== '' ? l.phones.join(' / ') : 'Contato pendente'}</span>
                         </div>
                         <div className="flex items-start gap-3">
                           <MapPin size={14} className="text-indigo-400 mt-1" />
                           <span className="text-xs font-bold text-slate-700">{l.address}</span>
                         </div>
                      </div>
                    </div>
                    <button onClick={() => handleRealDataConsult(l.cnpj, l.name)} className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                      <ShieldCheck size={14} /> RELATÓRIO COMPLETO
                    </button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {currentView === 'dashboard' && <Dashboard companies={MOCK_COMPANIES} />}
      </main>

      {/* MODAL DE DOSSIÊ ESTRUTURADO - ATUALIZADO COM QUADRO SOCIETÁRIO */}
      {selectedItem && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-4xl bg-[#F8FAFC] h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl">{selectedItem.name[0]}</div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedItem.name}</h2>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono"><Hash size={12} /> {selectedItem.identifier}</div>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-20">
              {isSearching ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <h3 className="text-2xl font-black text-slate-900">Gerando Auditoria OSINT...</h3>
                </div>
              ) : publicDataReport ? (() => {
                const { sections, risk } = parseDossie(publicDataReport.text);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
                    <div className={`col-span-full p-8 rounded-[2.5rem] border-2 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 ${
                      risk === 'alto' ? 'bg-red-50 border-red-100 text-red-900' : risk === 'medio' ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           {risk === 'alto' ? <AlertTriangle /> : <CheckCircle />}
                           <span className="text-xs font-black uppercase tracking-widest">Resumo de Auditoria</span>
                        </div>
                        <p className="font-medium text-sm leading-relaxed">{sections.resumo}</p>
                      </div>
                      <div className="bg-white/50 px-8 py-4 rounded-3xl backdrop-blur-md flex flex-col items-center min-w-[140px]">
                        <span className="text-[10px] font-black uppercase mb-1 opacity-60 text-center">Risco de Crédito/Compliance</span>
                        <span className="text-2xl font-black uppercase tracking-tighter">{risk}</span>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-indigo-600"><Building2 size={24} /><h4 className="font-black text-lg">Dossiê Cadastral</h4></div>
                      <div className="prose prose-slate prose-sm max-w-none whitespace-pre-line text-slate-600 font-medium leading-relaxed">{sections.dados}</div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-emerald-600"><Users size={24} /><h4 className="font-black text-lg">Quadro Societário & Capital</h4></div>
                      <div className="prose prose-slate prose-sm max-w-none whitespace-pre-line text-slate-600 font-medium leading-relaxed">{sections.socios}</div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-slate-900"><Scale size={24} /><h4 className="font-black text-lg">Histórico Jurídico</h4></div>
                      <div className="prose prose-slate prose-sm max-w-none whitespace-pre-line text-slate-600 font-medium leading-relaxed">{sections.juridico}</div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-blue-600"><Share2 size={24} /><h4 className="font-black text-lg">Presença Digital</h4></div>
                      <div className="prose prose-slate prose-sm max-w-none whitespace-pre-line text-slate-600 font-medium leading-relaxed">{sections.social}</div>
                    </div>

                    <div className="col-span-full bg-slate-900 p-8 rounded-[2.5rem] text-white">
                      <div className="flex items-center gap-3 mb-6 text-indigo-400">
                        <Globe size={24} />
                        <h4 className="font-black text-lg tracking-tight">Referências e Fontes OSINT</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {publicDataReport.sources.map((source, idx) => (
                          <a 
                            key={idx} href={source.uri} target="_blank" rel="noopener noreferrer"
                            className="bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-between group"
                          >
                            <span className="text-xs font-bold truncate max-w-[250px]">{source.title}</span>
                            <ExternalLink size={14} className="opacity-40 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })() : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
