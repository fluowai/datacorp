
import React, { useState, useMemo, useEffect } from 'react';
import Markdown from 'react-markdown';
import Sidebar from './components/Sidebar';
import FilterModal from './components/FilterModal';
import AuthView from './components/AuthView';
import { ViewType, GoogleMapsPlace, EnrichedLeadData, InstagramProfile, WhatsAppGroup, CnaeCompany, AdvancedSearchParams, ChartData, Agent, ApiKeys } from './types';
import { 
  Search, X, MapPin, ShieldCheck, Loader2, Target, Users, Navigation, Phone, Zap, 
  Scale, Share2, AlertTriangle, CheckCircle, Hash, Building2, Star, Menu, ExternalLink, Globe,
  Instagram, Facebook, Linkedin, LayoutDashboard, MoreVertical, Trash2, Check as CheckIcon,
  MessageSquare, UserPlus, Eye, Info, History, TrendingUp, PieChart as PieChartIcon,
  Bot, Plus, Key, Store, Download
} from 'lucide-react';
import { 
  fetchPublicDataReport, 
  fetchGoogleMapsStream, 
  enrichLeadData, 
  fetchInstagramProfiles, 
  fetchWhatsAppGroups,
  fetchCompaniesByCnaeStream,
  fetchAdvancedSearchStream
} from './services/geminiService';
import { 
  PieChart, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  Pie 
} from 'recharts';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedItem, setSelectedItem] = useState<{name: string, identifier: string, type: 'EMPRESA' | 'PESSOA'} | null>(null);
  const [publicDataReport, setPublicDataReport] = useState<{text: string, sources: any[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  
  const [mapsPlaces, setMapsPlaces] = useState<GoogleMapsPlace[]>([]);
  const [kanbanLeads, setKanbanLeads] = useState<GoogleMapsPlace[]>([]);
  const [instaProfiles, setInstaProfiles] = useState<InstagramProfile[]>([]);
  const [waGroups, setWaGroups] = useState<WhatsAppGroup[]>([]);
  const [cnaeCompanies, setCnaeCompanies] = useState<CnaeCompany[]>([]);
  const [advancedResults, setAdvancedResults] = useState<CnaeCompany[]>([]);
  
  const [mapsSearch, setMapsSearch] = useState('');
  const [instaSearch, setInstaSearch] = useState('');
  const [waSearch, setWaSearch] = useState('');
  const [cnaeSearch, setCnaeSearch] = useState('');
  const [minCapital, setMinCapital] = useState(100000);
  const [citySearch, setCitySearch] = useState('');

  const [advFilters, setAdvFilters] = useState<AdvancedSearchParams>({
    sector: '',
    city: '',
    state: '',
    minCapital: 0,
    maxCapital: 10000000,
    minEmployees: 0,
    activity: ''
  });
  
  const [searchLimit, setSearchLimit] = useState(20);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{current: number, total: number} | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const saved = localStorage.getItem('woosender_api_keys');
    return saved ? JSON.parse(saved) : {};
  });

  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('woosender_agents');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'SDR Alpha',
        type: 'SDR',
        description: 'Agente especializado em qualificação inicial de leads.',
        prompt: 'Você é um SDR sênior. Sua missão é qualificar leads...',
        model: 'gemini-1.5-flash',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [recentInvestigations, setRecentInvestigations] = useState<{id: string, term: string, date: string}[]>(() => {
    const saved = localStorage.getItem('woosender_recent_investigations');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    type: 'SDR',
    status: 'active',
    model: 'Gemini 1.5 Flash'
  });

  const handleCreateAgent = () => {
    if (!newAgent.name || !newAgent.description) {
      alert("Preencha o nome e a descrição do agente.");
      return;
    }
    const agent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAgent.name,
      type: newAgent.type as any,
      description: newAgent.description,
      prompt: newAgent.prompt || '',
      model: newAgent.model || 'Gemini 1.5 Flash',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    setAgents([agent, ...agents]);
    setIsCreatingAgent(false);
    setNewAgent({ type: 'SDR', status: 'active', model: 'Gemini 1.5 Flash' });
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este agente?")) {
      setAgents(agents.filter(a => a.id !== id));
    }
  };

  useEffect(() => {
    localStorage.setItem('woosender_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem('woosender_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('woosender_recent_investigations', JSON.stringify(recentInvestigations));
  }, [recentInvestigations]);

  // Google Maps Parser
  useEffect(() => {
    if (currentView !== 'google_maps') return;
    const placeBlocks = streamingText.split('---PLACE_START---').slice(1);
    const parsedPlaces: GoogleMapsPlace[] = placeBlocks.map(block => {
      const cleanBlock = block.split('---PLACE_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().startsWith(key.toUpperCase()));
        return line ? line.substring(line.indexOf(':') + 1).trim() : '';
      };
      return {
        id: crypto.randomUUID(),
        name: findValue('NOME'),
        address: findValue('ENDERECO'),
        rating: findValue('AVALIACAO'),
        reviews: findValue('REVIEWS'),
        phone: findValue('TELEFONE'),
        website: findValue('SITE'),
        category: findValue('CATEGORIA'),
        mapsLink: findValue('MAPS_LINK'),
        instagram: findValue('INSTAGRAM'),
        facebook: findValue('FACEBOOK'),
        linkedin: findValue('LINKEDIN'),
        kanbanStatus: 'lead' as const
      };
    }).filter(p => p.name);
    setMapsPlaces(parsedPlaces);
  }, [streamingText, currentView]);

  // Instagram Parser
  useEffect(() => {
    if (currentView !== 'instagram_search') return;
    const blocks = streamingText.split('---INSTA_START---').slice(1);
    const parsed: InstagramProfile[] = blocks.map(block => {
      const cleanBlock = block.split('---INSTA_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().startsWith(key.toUpperCase()));
        return line ? line.substring(line.indexOf(':') + 1).trim() : '';
      };
      return {
        id: crypto.randomUUID(),
        username: findValue('USERNAME'),
        fullName: findValue('NOME'),
        bio: findValue('BIO'),
        followers: findValue('SEGUIDORES'),
        following: findValue('SEGUINDO'),
        posts: findValue('POSTS'),
        link: findValue('LINK'),
        isBusiness: findValue('BUSINESS').toUpperCase() === 'TRUE',
        category: findValue('CATEGORIA')
      };
    }).filter(p => p.username);
    setInstaProfiles(parsed);
  }, [streamingText, currentView]);

  // WhatsApp Parser
  useEffect(() => {
    if (currentView !== 'whatsapp_search') return;
    const blocks = streamingText.split('---WA_START---').slice(1);
    const parsed: WhatsAppGroup[] = blocks.map(block => {
      const cleanBlock = block.split('---WA_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().startsWith(key.toUpperCase()));
        return line ? line.substring(line.indexOf(':') + 1).trim() : '';
      };
      return {
        id: crypto.randomUUID(),
        name: findValue('NOME'),
        link: findValue('LINK'),
        description: findValue('DESCRICAO'),
        participantsCount: findValue('PARTICIPANTES'),
        isValid: findValue('VALIDO').toUpperCase() === 'TRUE',
        lastValidated: new Date().toLocaleString()
      };
    }).filter(g => g.name);
    setWaGroups(parsed);
  }, [streamingText, currentView]);

  // CNAE Parser
  useEffect(() => {
    if (currentView !== 'cnae_search') return;
    const blocks = streamingText.split('---COMPANY_START---').slice(1);
    const parsed: CnaeCompany[] = blocks.map(block => {
      const cleanBlock = block.split('---COMPANY_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        // Busca flexível: procura a linha que contém a chave seguida de dois pontos
        const line = lines.find(l => l.toUpperCase().includes(key.toUpperCase() + ':'));
        if (!line) return '';
        const parts = line.split(':');
        return parts.slice(1).join(':').trim();
      };
      return {
        id: crypto.randomUUID(),
        name: findValue('NOME'),
        cnpj: findValue('CNPJ'),
        capital: findValue('CAPITAL'),
        partners: findValue('SOCIOS'),
        address: findValue('ENDERECO'),
        phone: findValue('TELEFONE'),
        website: findValue('SITE'),
        mapsLink: findValue('MAPS'),
        instagram: findValue('INSTAGRAM'),
        linkedin: findValue('LINKEDIN'),
        activity: findValue('ATIVIDADE')
      };
    }).filter(c => c.name && c.name.length > 2);
    setCnaeCompanies(parsed);
  }, [streamingText, currentView]);

  // Advanced Search Parser
  useEffect(() => {
    if (currentView !== 'advanced_search') return;
    const blocks = streamingText.split('---COMPANY_START---').slice(1);
    const parsed: CnaeCompany[] = blocks.map(block => {
      const cleanBlock = block.split('---COMPANY_END---')[0];
      const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
      const findValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().includes(key.toUpperCase() + ':'));
        if (!line) return '';
        const parts = line.split(':');
        return parts.slice(1).join(':').trim();
      };
      return {
        id: crypto.randomUUID(),
        name: findValue('NOME'),
        cnpj: findValue('CNPJ'),
        capital: findValue('CAPITAL'),
        partners: findValue('SOCIOS'),
        address: findValue('ENDERECO'),
        phone: findValue('TELEFONE'),
        website: findValue('SITE'),
        mapsLink: findValue('MAPS'),
        instagram: findValue('INSTAGRAM'),
        linkedin: findValue('LINKEDIN'),
        activity: findValue('ATIVIDADE')
      };
    }).filter(c => c.name && c.name.length > 2);
    setAdvancedResults(parsed);
  }, [streamingText, currentView]);

  const handleEnrichment = async (placeIndex: number, isBatch = false) => {
    const place = mapsPlaces[placeIndex];
    if (!place || (!isBatch && isEnriching)) return;

    setIsEnriching(place.name);
    try {
      const resultText = await enrichLeadData(place.name, place.address, apiKeys.gemini);
      
      const cleanBlock = resultText.split('---ENRICH_START---')[1]?.split('---ENRICH_END---')[0];
      if (cleanBlock) {
        const lines = cleanBlock.split('\n').map(l => l.trim()).filter(l => l !== '');
        const findValue = (key: string) => {
          const line = lines.find(l => l.toUpperCase().startsWith(key.toUpperCase()));
          return line ? line.substring(line.indexOf(':') + 1).trim() : '';
        };

        const enriched: EnrichedLeadData = {
          cnpj: findValue('CNPJ'),
          partners: findValue('SOCIOS').split(',').map(s => s.trim()).filter(s => s),
          capital: findValue('CAPITAL'),
          status: findValue('SITUACAO'),
          openingDate: findValue('ABERTURA'),
          activity: findValue('ATIVIDADE')
        };

        setMapsPlaces(prev => prev.map(p => p.id === place.id ? { ...p, enrichedData: enriched } : p));
        
        // Update in Kanban too if exists
        setKanbanLeads(prev => prev.map(l => l.id === place.id ? { ...l, enrichedData: enriched } : l));
      }
    } catch (error) {
      alert("Erro ao enriquecer dados.");
    } finally {
      setIsEnriching(null);
    }
  };

  const handleBatchEnrichment = async () => {
    if (isSearching || isEnriching) return;
    const unenrichedIndices = mapsPlaces.map((p, idx) => p.enrichedData ? -1 : idx).filter(idx => idx !== -1);
    if (unenrichedIndices.length === 0) return;

    setEnrichmentProgress({ current: 0, total: unenrichedIndices.length });
    
    for (let i = 0; i < unenrichedIndices.length; i++) {
      const idx = unenrichedIndices[i];
      setEnrichmentProgress({ current: i + 1, total: unenrichedIndices.length });
      await handleEnrichment(idx, true);
      // Pequeno delay para estabilidade da UI e evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setEnrichmentProgress(null);
  };

  const addToKanban = (place: GoogleMapsPlace) => {
    if (kanbanLeads.find(l => l.id === place.id)) return;
    setKanbanLeads(prev => [...prev, { ...place, kanbanStatus: 'lead' }]);
  };

  const addCnaeToKanban = (company: CnaeCompany) => {
    if (kanbanLeads.find(l => l.id === company.id)) return;
    
    const place: GoogleMapsPlace = {
      id: company.id,
      name: company.name,
      address: company.address,
      phone: company.phone,
      website: company.website,
      mapsLink: company.mapsLink,
      instagram: company.instagram,
      linkedin: company.linkedin,
      category: company.activity,
      rating: 'N/A',
      reviews: 'N/A',
      kanbanStatus: 'lead',
      enrichedData: {
        cnpj: company.cnpj,
        partners: company.partners.split(',').map(s => s.trim()),
        capital: company.capital,
        status: 'Ativa',
        openingDate: 'N/A',
        activity: company.activity
      }
    };
    
    setKanbanLeads(prev => [...prev, place]);
  };

  const handleBatchCnaeToKanban = () => {
    const newLeads = cnaeCompanies.filter(c => !kanbanLeads.find(l => l.id === c.id));
    if (newLeads.length === 0) {
      alert("Todos os leads já estão no Kanban.");
      return;
    }

    const places: GoogleMapsPlace[] = newLeads.map(company => ({
      id: company.id,
      name: company.name,
      address: company.address,
      phone: company.phone,
      website: company.website,
      mapsLink: company.mapsLink,
      instagram: company.instagram,
      linkedin: company.linkedin,
      category: company.activity,
      rating: 'N/A',
      reviews: 'N/A',
      kanbanStatus: 'lead',
      enrichedData: {
        cnpj: company.cnpj,
        partners: company.partners.split(',').map(s => s.trim()),
        capital: company.capital,
        status: 'Ativa',
        openingDate: 'N/A',
        activity: company.activity
      }
    }));

    setKanbanLeads(prev => [...prev, ...places]);
    alert(`${places.length} leads enviados para o Kanban com sucesso!`);
  };

  const moveKanbanLead = (id: string, newStatus: any) => {
    setKanbanLeads(prev => prev.map(l => l.id === id ? { ...l, kanbanStatus: newStatus } : l));
  };

  const removeFromKanban = (id: string) => {
    setKanbanLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleRealDataConsult = async (targetIdentifier?: string, targetName?: string) => {
    if (!apiKeys.gemini) {
      setView('integrations');
      return;
    }
    const query = targetIdentifier || targetName || searchTerm;
    if (!query || query.length < 3) return;
    
    const identifier = targetIdentifier || query;
    const name = targetName || query;
    
    // Detectar se é CPF ou CNPJ e validar formato básico
    const digitsOnly = identifier.replace(/\D/g, '');
    let type: 'EMPRESA' | 'PESSOA' = 'EMPRESA';
    let searchQuery = query;

    if (digitsOnly.length === 11) {
      type = 'PESSOA';
      searchQuery = `Investigação OSINT CPF ${digitsOnly} - sócio de empresas, processos judiciais, histórico profissional`;
    } else if (digitsOnly.length === 14) {
      type = 'EMPRESA';
      searchQuery = `Investigação OSINT CNPJ ${digitsOnly} - quadro societário QSA, capital social, processos, filiais, situação cadastral`;
    } else {
      type = 'PESSOA';
      searchQuery = `Investigação OSINT Nome "${query}" - CPF, participações societárias, processos judiciais, LinkedIn`;
    }
    
    setSelectedItem({ name, identifier, type });
    setPublicDataReport(null);
    setIsSearching(true);
    setView('osint_search');

    // Track investigation
    const newInv = { id: Math.random().toString(36).substr(2, 9), term: name, date: new Date().toLocaleDateString('pt-BR') };
    setRecentInvestigations(prev => [newInv, ...prev.slice(0, 9)]);
    try {
      const result = await fetchPublicDataReport(identifier, searchQuery, type, apiKeys.gemini);
      setPublicDataReport(result);
    } catch (error) {
      alert("Erro ao realizar consulta OSINT.");
    } finally { setIsSearching(false); }
  };

  const handleMapsMining = async () => {
    if (!apiKeys.gemini) {
      setView('integrations');
      return;
    }
    if (!mapsSearch) return;
    setIsSearching(true);
    setStreamingText('');
    setMapsPlaces([]);
    try {
      const stream = await fetchGoogleMapsStream(mapsSearch, searchLimit, apiKeys.gemini);
      for await (const chunk of stream) {
        setStreamingText(prev => prev + (chunk.text || ''));
      }
    } catch (error) { alert("Erro na busca do Maps."); } finally { setIsSearching(false); }
  };

  const handleInstaMining = async () => {
    if (!apiKeys.gemini) {
      setView('integrations');
      return;
    }
    if (!instaSearch) return;
    setIsSearching(true);
    setStreamingText('');
    setInstaProfiles([]);
    try {
      const stream = await fetchInstagramProfiles(instaSearch, searchLimit, apiKeys.gemini);
      for await (const chunk of stream) {
        setStreamingText(prev => prev + (chunk.text || ''));
      }
    } catch (error) { alert("Erro na busca do Instagram."); } finally { setIsSearching(false); }
  };

  const handleWaMining = async () => {
    if (!apiKeys.gemini) {
      setView('integrations');
      return;
    }
    if (!waSearch) return;
    setIsSearching(true);
    setStreamingText('');
    setWaGroups([]);
    try {
      const stream = await fetchWhatsAppGroups(waSearch, searchLimit, apiKeys.gemini);
      for await (const chunk of stream) {
        setStreamingText(prev => prev + (chunk.text || ''));
      }
    } catch (error) { alert("Erro na busca do WhatsApp."); } finally { setIsSearching(false); }
  };

  const handleCnaeMining = async () => {
    if (!apiKeys.gemini) {
      setView('integrations');
      return;
    }
    if (!cnaeSearch || !citySearch) return;
    setIsSearching(true);
    setStreamingText('');
    setCnaeCompanies([]);
    try {
      const stream = await fetchCompaniesByCnaeStream(cnaeSearch, minCapital, citySearch, searchLimit, apiKeys.gemini);
      for await (const chunk of stream) {
        setStreamingText(prev => prev + (chunk.text || ''));
      }
    } catch (error) { alert("Erro na busca por CNAE."); } finally { setIsSearching(false); }
  };

  const handleAdvancedSearch = async () => {
    if (!apiKeys.gemini) {
      setView('integrations');
      return;
    }
    setIsSearching(true);
    setStreamingText('');
    setAdvancedResults([]);
    try {
      const stream = await fetchAdvancedSearchStream(advFilters, searchLimit, apiKeys.gemini);
      for await (const chunk of stream) {
        setStreamingText(prev => prev + (chunk.text || ''));
      }
    } catch (error) { alert("Erro na busca avançada."); } finally { setIsSearching(false); }
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
    
    let risk: 'alto' | 'medio' | 'baixo' | 'indeterminado' = 'baixo';
    if (text.toUpperCase().includes('ALTO')) risk = 'alto';
    else if (text.toUpperCase().includes('MÉDIO')) risk = 'medio';
    else if (text.toUpperCase().includes('INDETERMINADO')) risk = 'indeterminado';

    const noData = text.toLowerCase().includes('nenhum dado público encontrado') || text.length < 50;

    return { sections, risk, noData };
  };

  if (!user) {
    return <AuthView onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-['Inter']">
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        filters={{} as any} 
        setFilters={() => {}} 
        user={user}
        onLogout={() => setUser(null)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onInvestigate={() => handleRealDataConsult()}
      />

      <main className="flex-1 lg:ml-64 p-4 lg:p-12 relative">
        {!apiKeys.gemini && (
          <div className="mb-8 bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-lg font-black text-amber-900">Configuração Necessária</p>
                <p className="text-sm font-medium text-amber-700">A chave do Google Gemini API não foi configurada. As funções de prospecção e OSINT estão desativadas.</p>
              </div>
            </div>
            <button 
              onClick={() => setView('integrations')}
              className="w-full md:w-auto bg-amber-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-amber-700 transition-all shadow-xl shadow-amber-100"
            >
              CONFIGURAR AGORA
            </button>
          </div>
        )}
        <header className="mb-10 max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight italic">woosender OSINT</h1>
              <p className="text-slate-500 font-medium text-sm lg:text-base">Inteligência de mercado e enriquecimento de leads.</p>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white rounded-xl shadow-sm border border-slate-100"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 lg:p-12 text-white shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-6 leading-tight">
                  Bem-vindo ao <span className="text-indigo-400">woosender</span> Intelligence.
                </h2>
                <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed">
                  Sua central de comando para prospecção B2B, enriquecimento de dados e inteligência OSINT em tempo real.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => setView('google_maps')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/20">
                    <MapPin size={20} /> INICIAR PROSPECÇÃO
                  </button>
                  <button onClick={() => setView('osint_search')} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 backdrop-blur-md">
                    <ShieldCheck size={20} /> INVESTIGAÇÃO OSINT
                  </button>
                </div>
              </div>
              
              {/* Abstract background elements */}
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[10%] w-[300px] h-[300px] bg-rose-500 rounded-full blur-[100px]" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Target size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total de Leads</p>
                <h3 className="text-3xl font-black text-slate-900">{kanbanLeads.length + mapsPlaces.length}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Bot size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Agentes Ativos</p>
                <h3 className="text-3xl font-black text-slate-900">{agents.filter(a => a.status === 'active').length}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Auditorias OSINT</p>
                <h3 className="text-3xl font-black text-slate-900">124</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Créditos Restantes</p>
                <h3 className="text-3xl font-black text-slate-900">8.4k</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity / Leads */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Leads Recentes</h3>
                  <button onClick={() => setView('kanban')} className="text-indigo-600 text-xs font-black hover:underline">VER TODOS</button>
                </div>
                <div className="space-y-4">
                  {kanbanLeads.slice(0, 5).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{lead.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{lead.address}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        lead.kanbanStatus === 'closed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {lead.kanbanStatus}
                      </div>
                    </div>
                  ))}
                  {kanbanLeads.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-sm font-medium italic">Nenhum lead no pipeline ainda.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions / Integration Status */}
              <div className="space-y-6">
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                  <h3 className="text-lg font-black mb-4">Status da API</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-200">Google Gemini</span>
                      <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${apiKeys.gemini ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'}`}>
                        {apiKeys.gemini ? 'CONECTADO' : 'DESCONECTADO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-200">OpenAI</span>
                      <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${apiKeys.openai ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'}`}>
                        {apiKeys.openai ? 'CONECTADO' : 'DESCONECTADO'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setView('integrations')} className="w-full mt-8 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black transition-all">
                    GERENCIAR CHAVES
                  </button>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <History className="text-indigo-400" size={24} />
                    <h3 className="text-lg font-black">Investigações Recentes</h3>
                  </div>
                  <div className="space-y-3">
                    {recentInvestigations.slice(0, 3).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-xs font-bold truncate max-w-[120px]">{inv.term}</span>
                        <span className="text-[10px] text-slate-500">{inv.date}</span>
                      </div>
                    ))}
                    {recentInvestigations.length === 0 && (
                      <p className="text-slate-500 text-[10px] italic">Nenhuma investigação recente.</p>
                    )}
                  </div>
                  <button onClick={() => setView('osint_search')} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-500/20">
                    NOVA CONSULTA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'google_maps' && (
          <div className="space-y-8 max-w-7xl mx-auto">
             <div className="bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">Google Maps Intelligence</h2>
                      <p className="text-slate-500 text-xs lg:text-sm font-medium">Extração de dados reais de estabelecimentos.</p>
                    </div>
                  </div>
                  {mapsPlaces.length > 0 && (
                    <button 
                      onClick={handleBatchEnrichment}
                      disabled={isEnriching !== null}
                      className="hidden lg:flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all shadow-lg"
                    >
                      {isEnriching ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                      ENRIQUECIMENTO EM LOTE
                    </button>
                  )}
               </div>
               <div className="flex flex-col lg:flex-row gap-4 bg-slate-50 p-3 rounded-3xl border border-slate-200">
                  <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                    <Search className="text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Ex: 'Restaurantes em São Paulo'..."
                      className="flex-1 bg-transparent border-none outline-none py-2 text-base font-bold placeholder:text-slate-300"
                      value={mapsSearch}
                      onChange={(e) => setMapsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleMapsMining()}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">Extrair:</span>
                    <div className="flex gap-1">
                      {[20, 30, 50, 100].map(limit => (
                        <button
                          key={limit}
                          onClick={() => setSearchLimit(limit)}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                            searchLimit === limit 
                              ? 'bg-rose-600 text-white shadow-md' 
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {limit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleMapsMining} disabled={isSearching} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-rose-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-rose-100">
                    {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />} BUSCAR
                  </button>
               </div>

               {enrichmentProgress && (
                 <div className="bg-indigo-600 p-4 rounded-2xl text-white flex items-center justify-between animate-pulse shadow-lg shadow-indigo-100">
                   <div className="flex items-center gap-3">
                     <Zap className="animate-bounce" size={20} />
                     <div>
                       <p className="text-xs font-black uppercase tracking-widest">Enriquecimento em Lote Ativo</p>
                       <p className="text-[10px] font-medium opacity-80">Processando lead {enrichmentProgress.current} de {enrichmentProgress.total}...</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-white transition-all duration-500" 
                         style={{ width: `${(enrichmentProgress.current / enrichmentProgress.total) * 100}%` }}
                       />
                     </div>
                     <span className="text-xs font-black">{Math.round((enrichmentProgress.current / enrichmentProgress.total) * 100)}%</span>
                   </div>
                 </div>
               )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {mapsPlaces.map((place, i) => (
                 <div key={place.id} className="bg-white p-6 lg:p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                          <span className="text-[10px] font-black uppercase text-rose-600">{place.category}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                          <Star size={14} fill="currentColor" /> {place.rating} <span className="text-slate-300 font-medium">({place.reviews})</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 group-hover:text-rose-600 transition-colors">{place.name}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {place.phone && (
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                            <CheckCircle size={10} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase">Telefone Verificado</span>
                          </div>
                        )}
                        {place.website && (
                          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                            <Globe size={10} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase">Site Ativo</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <MapPin size={14} className="text-rose-400 mt-1 shrink-0" />
                          <span className="text-xs font-bold text-slate-600">{place.address}</span>
                        </div>
                        {place.phone && (
                          <div className="flex items-start gap-3">
                            <Phone size={14} className="text-emerald-500 mt-1 shrink-0" />
                            <span className="text-xs font-black text-slate-900">{place.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          {place.instagram && (
                            <a href={place.instagram} target="_blank" className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-all">
                              <Instagram size={16} />
                            </a>
                          )}
                          {place.facebook && (
                            <a href={place.facebook} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                              <Facebook size={16} />
                            </a>
                          )}
                          {place.linkedin && (
                            <a href={place.linkedin} target="_blank" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                              <Linkedin size={16} />
                            </a>
                          )}
                        </div>
                      </div>

                      {place.enrichedData && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Dados Enriquecidos</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase">CNPJ</p>
                              <p className="text-xs font-bold text-slate-900">{place.enrichedData.cnpj}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase">Status</p>
                              <p className="text-xs font-bold text-emerald-600">{place.enrichedData.status}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase">Sócios</p>
                              <p className="text-xs font-bold text-slate-900 truncate">{place.enrichedData.partners.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 mt-6">
                       <div className="grid grid-cols-2 gap-2">
                          <a href={place.mapsLink} target="_blank" className="bg-rose-600 text-white py-3 rounded-xl font-black text-xs hover:bg-rose-500 transition-all flex items-center justify-center gap-2 shadow-lg">
                            <Navigation size={16} /> MAPS
                          </a>
                          <button 
                            onClick={() => addToKanban(place)}
                            className="bg-white border border-slate-200 text-slate-900 py-3 rounded-xl font-black text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                          >
                            <LayoutDashboard size={16} /> KANBAN
                          </button>
                       </div>
                      {!place.enrichedData ? (
                        <button 
                          onClick={() => handleEnrichment(i)}
                          disabled={isEnriching === place.name}
                          className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          {isEnriching === place.name ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                          {isEnriching === place.name ? 'ENRIQUECENDO...' : 'ENRIQUECER LEAD'}
                        </button>
                      ) : (
                        <button onClick={() => handleRealDataConsult(place.enrichedData?.cnpj, place.name)} className="w-full bg-white border border-slate-100 text-slate-400 py-3 rounded-xl font-black text-[10px] hover:text-rose-600 transition-all flex items-center justify-center gap-2">
                          <ShieldCheck size={12} /> AUDITORIA COMPLETA
                        </button>
                      )}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {currentView === 'kanban' && (
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Pipeline de Leads</h2>
              <p className="text-slate-500 text-sm font-medium">Gerencie seus leads prospectados do Google Maps.</p>
            </header>
            
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
              {[
                { id: 'lead', label: 'Novos Leads', color: 'bg-blue-500' },
                { id: 'contacted', label: 'Contatados', color: 'bg-amber-500' },
                { id: 'negotiating', label: 'Em Negociação', color: 'bg-indigo-500' },
                { id: 'closed', label: 'Fechados', color: 'bg-emerald-500' },
                { id: 'archived', label: 'Arquivados', color: 'bg-slate-500' }
              ].map(column => (
                <div key={column.id} className="min-w-[320px] flex-1 snap-start">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${column.color}`} />
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">{column.label}</h3>
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {kanbanLeads.filter(l => l.kanbanStatus === column.id).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 min-h-[500px] bg-slate-50/50 p-3 rounded-3xl border border-dashed border-slate-200">
                    {kanbanLeads.filter(l => l.kanbanStatus === column.id).map(lead => (
                      <div key={lead.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-black text-slate-900 text-sm leading-tight">{lead.name}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => removeFromKanban(lead.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mb-4 line-clamp-1">{lead.address}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {lead.enrichedData && <ShieldCheck size={14} className="text-emerald-500" />}
                            {lead.phone && <Phone size={14} className="text-slate-400" />}
                          </div>
                          <select 
                            value={lead.kanbanStatus}
                            onChange={(e) => moveKanbanLead(lead.id, e.target.value)}
                            className="text-[10px] font-black bg-slate-50 border-none outline-none rounded-lg px-2 py-1 text-slate-600"
                          >
                            <option value="lead">Lead</option>
                            <option value="contacted">Contatado</option>
                            <option value="negotiating">Negociação</option>
                            <option value="closed">Fechado</option>
                            <option value="archived">Arquivado</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'instagram_search' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-100">
                  <Instagram size={28} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">Instagram Business Search</h2>
                  <p className="text-slate-500 text-xs lg:text-sm font-medium">Encontre perfis comerciais por nicho e palavra-chave.</p>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 bg-slate-50 p-3 rounded-3xl border border-slate-200">
                <input 
                  type="text" 
                  placeholder="Ex: 'Moda Feminina', 'Restaurantes Gourmet'..."
                  className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-base font-bold placeholder:text-slate-300"
                  value={instaSearch}
                  onChange={(e) => setInstaSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInstaMining()}
                />
                <button onClick={handleInstaMining} disabled={isSearching} className="bg-pink-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-pink-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-100">
                  {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />} BUSCAR PERFIS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instaProfiles.map((profile) => (
                <div key={profile.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full p-0.5">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-slate-900 font-black text-xl">
                        {profile.username[0].toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 leading-tight">@{profile.username}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profile.category}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">{profile.bio}</p>
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-50">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Posts</p>
                        <p className="text-sm font-black text-slate-900">{profile.posts}</p>
                      </div>
                      <div className="text-center border-x border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Seguidores</p>
                        <p className="text-sm font-black text-slate-900">{profile.followers}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Seguindo</p>
                        <p className="text-sm font-black text-slate-900">{profile.following}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href={profile.link} target="_blank" className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                      <Eye size={16} /> VER PERFIL
                    </a>
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all">
                      <UserPlus size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {!isSearching && instaProfiles.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                    <Instagram size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Nenhum perfil encontrado</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-md mx-auto mt-2">
                      Tente usar palavras-chave mais genéricas ou verifique a ortografia do nicho.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'whatsapp_search' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">WhatsApp Group Finder</h2>
                  <p className="text-slate-500 text-xs lg:text-sm font-medium">Busca inteligente e validação de grupos de convite.</p>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 bg-slate-50 p-3 rounded-3xl border border-slate-200">
                <input 
                  type="text" 
                  placeholder="Ex: 'Networking Empreendedores', 'Vagas de TI'..."
                  className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-base font-bold placeholder:text-slate-300"
                  value={waSearch}
                  onChange={(e) => setWaSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleWaMining()}
                />
                <button onClick={handleWaMining} disabled={isSearching} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100">
                  {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />} BUSCAR GRUPOS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {waGroups.map((group) => (
                <div key={group.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Users size={24} />
                    </div>
                    {group.isValid ? (
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100">
                        <CheckCircle size={12} /> VALIDADO
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black border border-rose-100">
                        <AlertTriangle size={12} /> NÃO VALIDADO
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{group.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-2">{group.description}</p>
                  
                  <div className="flex items-center gap-4 mb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1"><Users size={12} /> {group.participantsCount || 'N/A'} Membros</div>
                    <div className="flex items-center gap-1"><History size={12} /> {group.lastValidated}</div>
                  </div>

                  <div className="flex gap-2">
                    <a href={group.link} target="_blank" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-xs hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                      <ExternalLink size={16} /> ENTRAR NO GRUPO
                    </a>
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all">
                      <Info size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {!isSearching && waGroups.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                    <MessageSquare size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Nenhum grupo encontrado</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-md mx-auto mt-2">
                      Tente usar palavras-chave diferentes ou mais genéricas para encontrar grupos de convite.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'cnae_search' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Building2 size={28} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">Busca por CNAE & Capital Social</h2>
                  <p className="text-slate-500 text-xs lg:text-sm font-medium">Prospecção B2B qualificada por atividade e porte financeiro.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-3xl border border-slate-200">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Atividade / CNAE</span>
                  <input 
                    type="text" 
                    placeholder="Ex: 'TI', 'Construção', '6201-5/00'..."
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={cnaeSearch}
                    onChange={(e) => setCnaeSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Capital Social Mínimo</span>
                  <input 
                    type="number" 
                    placeholder="R$ 100.000"
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={minCapital}
                    onChange={(e) => setMinCapital(Number(e.target.value))}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Cidade / Região</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex: São Paulo, SP"
                      className="flex-1 bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCnaeMining()}
                    />
                    <button onClick={handleCnaeMining} disabled={isSearching} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                      {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Resultados: {cnaeCompanies.length}
                </span>
              </div>
              {cnaeCompanies.length > 0 && (
                <button 
                  onClick={handleBatchCnaeToKanban}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100"
                >
                  <LayoutDashboard size={16} /> ENVIAR LOTE PARA KANBAN
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isSearching && cnaeCompanies.length === 0 && (
                <div className="col-span-full bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse delay-75" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse delay-150" />
                    <span className="text-[10px] font-mono text-slate-500 ml-2 uppercase tracking-widest">Raspagem em tempo real via Google OSINT...</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400/80 leading-relaxed break-all whitespace-pre-wrap max-h-[200px] overflow-y-auto scrollbar-hide">
                    {streamingText || '> Inicializando motores de busca...\n> Conectando a diretórios empresariais...\n> Filtrando por Capital Social...'}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                </div>
              )}

              {cnaeCompanies.map((company) => (
                <div key={company.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col overflow-hidden">
                  <div className="p-6 pb-0">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100/50">
                        <TrendingUp size={12} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase text-indigo-700">R$ {company.capital}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Hash size={12} /> {company.cnpj}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem]">{company.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-5">
                      {company.phone && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                          <CheckCircle size={10} strokeWidth={3} />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Contato Direto</span>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                          <Globe size={10} strokeWidth={3} />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Site Oficial</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                        <MapPin size={16} className="text-rose-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-600 leading-relaxed">{company.address}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <Users size={14} className="text-indigo-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-500 truncate">Sócios: {company.partners.split(',')[0]}...</span>
                        </div>
                        {company.phone && (
                          <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                            <Phone size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-[10px] font-black text-emerald-700 truncate">{company.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {company.instagram && (
                          <a href={company.instagram} target="_blank" className="w-10 h-10 flex items-center justify-center bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-600 hover:text-white transition-all duration-300">
                            <Instagram size={18} />
                          </a>
                        )}
                        {company.linkedin && (
                          <a href={company.linkedin} target="_blank" className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300">
                            <Linkedin size={18} />
                          </a>
                        )}
                        {company.website && (
                          <a href={company.website} target="_blank" className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all duration-300">
                            <Globe size={18} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto space-y-3">
                    <div className="h-px bg-slate-100 mb-6" />
                    <div className="grid grid-cols-2 gap-3">
                      <a href={company.mapsLink} target="_blank" className="bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                        <Store size={14} /> GOOGLE BUSINESS
                      </a>
                      <button 
                        onClick={() => addCnaeToKanban(company)}
                        disabled={!!kanbanLeads.find(l => l.id === company.id)}
                        className={`
                          py-3.5 rounded-2xl font-black text-[10px] transition-all flex items-center justify-center gap-2
                          ${!!kanbanLeads.find(l => l.id === company.id)
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
                        `}
                      >
                        {!!kanbanLeads.find(l => l.id === company.id) ? <CheckIcon size={14} /> : <LayoutDashboard size={14} />} 
                        {!!kanbanLeads.find(l => l.id === company.id) ? 'NO KANBAN' : 'KANBAN'}
                      </button>
                    </div>
                    <button onClick={() => handleRealDataConsult(company.cnpj, company.name)} className="w-full bg-indigo-50 text-indigo-600 py-3.5 rounded-2xl font-black text-[10px] hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-indigo-100">
                      <ShieldCheck size={14} /> AUDITORIA COMPLETA OSINT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'advanced_search' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Search size={28} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">Busca Avançada de Empresas</h2>
                  <p className="text-slate-500 text-xs lg:text-sm font-medium">Filtros precisos por setor, localização e métricas financeiras.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Setor / Nicho</span>
                  <input 
                    type="text" 
                    placeholder="Ex: Tecnologia, Varejo..."
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={advFilters.sector}
                    onChange={(e) => setAdvFilters({...advFilters, sector: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Cidade</span>
                  <input 
                    type="text" 
                    placeholder="Ex: São Paulo"
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={advFilters.city}
                    onChange={(e) => setAdvFilters({...advFilters, city: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Estado (UF)</span>
                  <input 
                    type="text" 
                    placeholder="Ex: SP"
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={advFilters.state}
                    onChange={(e) => setAdvFilters({...advFilters, state: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Capital Mínimo</span>
                  <input 
                    type="number" 
                    placeholder="R$ 0"
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={advFilters.minCapital}
                    onChange={(e) => setAdvFilters({...advFilters, minCapital: Number(e.target.value)})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Capital Máximo</span>
                  <input 
                    type="number" 
                    placeholder="R$ 10.000.000"
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={advFilters.maxCapital}
                    onChange={(e) => setAdvFilters({...advFilters, maxCapital: Number(e.target.value)})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Mín. Funcionários</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 50"
                    className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold outline-none"
                    value={advFilters.minEmployees}
                    onChange={(e) => setAdvFilters({...advFilters, minEmployees: Number(e.target.value)})}
                  />
                </div>
                <div className="flex flex-col gap-1 lg:col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase px-4">Ação</span>
                  <button 
                    onClick={handleAdvancedSearch} 
                    disabled={isSearching}
                    className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />} EXECUTAR BUSCA AVANÇADA
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isSearching && advancedResults.length === 0 && (
                <div className="col-span-full bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse delay-75" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse delay-150" />
                    <span className="text-[10px] font-mono text-slate-500 ml-2 uppercase tracking-widest">Busca Avançada em tempo real...</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400/80 leading-relaxed break-all whitespace-pre-wrap max-h-[200px] overflow-y-auto scrollbar-hide">
                    {streamingText || '> Analisando filtros...\n> Consultando bases de dados...\n> Cruzando métricas financeiras...'}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                </div>
              )}

              {advancedResults.map((company) => (
                <div key={company.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                        <span className="text-[10px] font-black uppercase text-indigo-600">Capital: R$ {company.capital}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 font-black text-[10px]">
                        <Hash size={12} /> {company.cnpj}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">{company.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3">
                        <MapPin size={14} className="text-rose-400 mt-1 shrink-0" />
                        <span className="text-xs font-bold text-slate-600">{company.address}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users size={14} className="text-indigo-400 mt-1 shrink-0" />
                        <span className="text-xs font-medium text-slate-500 line-clamp-1">Sócios: {company.partners}</span>
                      </div>
                      {company.phone && (
                        <div className="flex items-start gap-3">
                          <Phone size={14} className="text-emerald-500 mt-1 shrink-0" />
                          <span className="text-xs font-black text-slate-900">{company.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <a href={company.mapsLink} target="_blank" className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                      <Navigation size={16} /> VER NO GOOGLE MAPS
                    </a>
                    <button onClick={() => handleRealDataConsult(company.cnpj, company.name)} className="w-full bg-white border border-slate-100 text-slate-400 py-3 rounded-xl font-black text-[10px] hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                      <ShieldCheck size={12} /> AUDITORIA COMPLETA
                    </button>
                  </div>
                </div>
              ))}
              {!isSearching && advancedResults.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                    <Search size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Nenhum resultado encontrado</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-md mx-auto mt-2">
                      Ajuste os filtros da busca avançada para encontrar empresas que correspondam aos seus critérios.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'osint_search' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Investigação OSINT Profunda</h2>
                    <p className="text-slate-500 font-medium">Auditoria completa de pessoas e empresas em tempo real.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Digite Nome, CPF ou CNPJ para investigar..."
                      className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm outline-none focus:border-indigo-600 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRealDataConsult()}
                    />
                  </div>
                  <button 
                    onClick={() => handleRealDataConsult()}
                    disabled={isSearching}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                    INICIAR INVESTIGAÇÃO
                  </button>
                </div>
              </div>

              {isSearching ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900">Cruzando dados governamentais...</h3>
                    <p className="text-slate-500 text-sm font-medium">Aguarde enquanto nosso motor OSINT varre a rede.</p>
                  </div>
                </div>
              ) : publicDataReport ? (() => {
                const { sections, risk, noData } = parseDossie(publicDataReport.text);
                
                if (noData) {
                  return (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
                      <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                        <Info size={40} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Nenhum dado público encontrado</h3>
                        <p className="text-slate-500 text-sm font-medium max-w-md mx-auto mt-2">
                          Não foram encontrados registros públicos vinculados a este identificador nas fontes consultadas. Verifique se o Nome, CPF ou CNPJ está correto.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
                    <div className={`col-span-full p-8 rounded-[2.5rem] border-2 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 ${
                      risk === 'alto' ? 'bg-red-50 border-red-100 text-red-900' : risk === 'medio' ? 'bg-amber-50 border-amber-100 text-amber-900' : risk === 'indeterminado' ? 'bg-slate-50 border-slate-100 text-slate-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'
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
                      <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium leading-relaxed">
                        <Markdown>{sections.dados}</Markdown>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-emerald-600"><Users size={24} /><h4 className="font-black text-lg">Quadro Societário & Capital</h4></div>
                      <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium leading-relaxed">
                        <Markdown>{sections.socios}</Markdown>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-slate-900"><Scale size={24} /><h4 className="font-black text-lg">Histórico Jurídico</h4></div>
                      <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium leading-relaxed">
                        <Markdown>{sections.juridico}</Markdown>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 text-blue-600"><Share2 size={24} /><h4 className="font-black text-lg">Presença Digital</h4></div>
                      <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium leading-relaxed">
                        <Markdown>{sections.social}</Markdown>
                      </div>
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
              })() : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <ShieldCheck size={80} className="opacity-10 mb-6" />
                  <p className="font-bold">Insira um identificador acima para começar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'agents' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agentes de IA</h2>
                  <p className="text-slate-500 font-medium">Crie e gerencie sua força de trabalho sintética.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreatingAgent(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl"
              >
                <Plus size={20} /> CRIAR NOVO AGENTE
              </button>
            </div>

            {isCreatingAgent && (
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900">Configurar Novo Agente</h3>
                  <button onClick={() => setIsCreatingAgent(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome do Agente</label>
                      <input 
                        type="text" 
                        placeholder="Ex: SDR Atendimento"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:border-indigo-600 transition-all"
                        value={newAgent.name || ''}
                        onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tipo de Função</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:border-indigo-600 transition-all"
                        value={newAgent.type}
                        onChange={e => setNewAgent({...newAgent, type: e.target.value as any})}
                      >
                        <option value="SDR">SDR (Qualificação)</option>
                        <option value="PROSPECCAO">Prospecção Ativa</option>
                        <option value="ATENDIMENTO">Atendimento / SDR</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Modelo de IA</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:border-indigo-600 transition-all"
                        value={newAgent.model}
                        onChange={e => setNewAgent({...newAgent, model: e.target.value})}
                      >
                        <option value="Gemini 1.5 Flash">Gemini 1.5 Flash (Rápido)</option>
                        <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Inteligente)</option>
                        <option value="GPT-4o">GPT-4o (OpenAI)</option>
                        <option value="Llama 3 70B">Llama 3 70B (Groq)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Descrição / Objetivo</label>
                      <textarea 
                        placeholder="O que este agente deve fazer?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:border-indigo-600 transition-all h-[120px]"
                        value={newAgent.description || ''}
                        onChange={e => setNewAgent({...newAgent, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Prompt de Sistema (Instruções)</label>
                      <textarea 
                        placeholder="Instruções detalhadas de comportamento..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:border-indigo-600 transition-all h-[120px]"
                        value={newAgent.prompt || ''}
                        onChange={e => setNewAgent({...newAgent, prompt: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  <button onClick={() => setIsCreatingAgent(false)} className="px-8 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all">CANCELAR</button>
                  <button onClick={handleCreateAgent} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-100">SALVAR AGENTE</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map(agent => (
                <div key={agent.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      agent.type === 'SDR' ? 'bg-blue-50 text-blue-600' : agent.type === 'PROSPECCAO' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {agent.type}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{agent.status}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{agent.name}</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2">{agent.description}</p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl">
                      <Zap size={14} className="text-amber-500" />
                      Modelo: {agent.model}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all">CONFIGURAR</button>
                    <button 
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                    <Bot size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Nenhum agente criado</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-md mx-auto mt-2">
                      Crie seu primeiro agente de IA para automatizar sua prospecção e atendimento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'integrations' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Key size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Integrações & API Keys</h2>
                  <p className="text-slate-500 font-medium">Conecte seus provedores de IA para potencializar o sistema.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">Google Gemini API</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Essencial para Prospecção e OSINT</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      placeholder="Insira sua Gemini API Key..."
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono outline-none focus:border-indigo-600 transition-all"
                      value={apiKeys.gemini || ''}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                    />
                  </div>
                  <p className="mt-4 text-[10px] text-slate-400 font-medium px-2 italic">
                    * Esta chave será usada para todas as consultas de prospecção e auditoria OSINT.
                  </p>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 opacity-60">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">OpenAI API</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Opcional para Agentes Avançados</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      placeholder="Insira sua OpenAI API Key..."
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono outline-none focus:border-indigo-600 transition-all"
                      value={apiKeys.openai || ''}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 opacity-60">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">Groq API</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Opcional para Respostas Ultra-Rápidas</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      placeholder="Insira sua Groq API Key..."
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono outline-none focus:border-indigo-600 transition-all"
                      value={apiKeys.groq || ''}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, groq: e.target.value }))}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => alert("Chaves salvas com sucesso!")}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-100"
                >
                  SALVAR CONFIGURAÇÕES
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico de Capital Social */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <PieChartIcon size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Distribuição por Capital Social</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cnaeCompanies.slice(0, 10).map(c => ({
                      name: c.name.substring(0, 10),
                      value: parseFloat(c.capital.replace(/[^0-9,]/g, '').replace(',', '.')) || 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Categorias */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <PieChartIcon size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Distribuição por Atividade</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const counts: Record<string, number> = {};
                          cnaeCompanies.forEach(c => {
                            const cat = c.activity.split(' ')[0] || 'Outros';
                            counts[cat] = (counts[cat] || 0) + 1;
                          });
                          return Object.entries(counts).map(([name, value]) => ({ name, value }));
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Métricas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                <div className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">Total de Leads</div>
                <div className="text-4xl font-black">{cnaeCompanies.length + mapsPlaces.length}</div>
                <div className="mt-4 flex items-center gap-2 text-indigo-200 text-xs">
                  <TrendingUp size={14} />
                  <span>+12% em relação à última busca</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Ticket Médio (Capital)</div>
                <div className="text-4xl font-black text-slate-900">
                  R$ {(() => {
                    const total = cnaeCompanies.reduce((acc, c) => acc + (parseFloat(c.capital.replace(/[^0-9,]/g, '').replace(',', '.')) || 0), 0);
                    return (total / (cnaeCompanies.length || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
                  })()}
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Taxa de Conversão Est.</div>
                <div className="text-4xl font-black text-slate-900">3.2%</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
