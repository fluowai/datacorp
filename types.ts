
export interface Partner {
  name: string;
  role: string;
  shareCapital: number;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface FinancialYear {
  year: number;
  revenue: number;
  profit: number;
}

export interface NewsItem {
  date: string;
  title: string;
  source: string;
  link: string;
}

export interface Company {
  id: string;
  cnpj: string;
  legalName: string;
  tradeName: string;
  status: 'Ativa' | 'Inativa' | 'Baixada';
  openingDate: string;
  capital: number;
  cnae: string;
  cnaeDescription: string;
  nature: string;
  address: Address;
  partners: Partner[];
  contact: {
    email: string;
    phone: string;
  };
  financialHistory: FinancialYear[];
  competitors: string[];
  recentNews: NewsItem[];
  metrics: {
    employees: number;
    growth: number;
    marketShare: number;
  };
}

export interface Lead {
  name: string;
  cnpj: string;
  address: string;
  partners: string[];
  phones: string[];
  googleBusinessLink?: string;
  sourceLink?: string;
  activity: string;
  capitalSocial?: string;
  sourceName?: string;
}

export interface InstagramProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  followers: string;
  following: string;
  posts: string;
  link: string;
  isBusiness: boolean;
  category: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  link: string;
  description: string;
  participantsCount?: string;
  isValid: boolean;
  lastValidated?: string;
}

export type KanbanStatus = 'lead' | 'contacted' | 'negotiating' | 'closed' | 'archived';

export interface GoogleMapsPlace {
  id: string;
  name: string;
  address: string;
  rating: string;
  reviews: string;
  phone: string;
  website: string;
  category: string;
  mapsLink: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  kanbanStatus?: KanbanStatus;
  enrichedData?: EnrichedLeadData;
}

export interface EnrichedLeadData {
  cnpj: string;
  partners: string[];
  capital: string;
  status: string;
  openingDate: string;
  activity: string;
}

export type ViewType = 'dashboard' | 'google_maps' | 'kanban' | 'instagram_search' | 'whatsapp_search' | 'cnae_search' | 'analytics' | 'advanced_search' | 'settings' | 'osint_search' | 'agents' | 'integrations';

export interface Agent {
  id: string;
  name: string;
  type: 'SDR' | 'PROSPECCAO' | 'ATENDIMENTO';
  description: string;
  prompt: string;
  model: string;
  status: 'active' | 'idle';
  createdAt: string;
}

export interface ApiKeys {
  gemini?: string;
  openai?: string;
  groq?: string;
}

export type SearchMode = 'CNPJ' | 'CPF' | 'NOME';

export interface FilterState {
  sector: string;
  state: string;
  size: 'Pequena' | 'Média' | 'Grande' | 'Todas';
}

export interface LeadScanParams {
  uf: string;
  city: string;
  cnae: string;
  cep: string;
  limit: number;
  minCapital?: string;
}

export interface MapsProspectingParams {
  profession: string;
  city: string;
  limit: number;
}

export interface CnaeSearchParams {
  cnae: string;
  minCapital: number;
  city: string;
  limit: number;
}

export interface CnaeCompany {
  id: string;
  name: string;
  cnpj: string;
  capital: string;
  partners: string;
  address: string;
  phone: string;
  website: string;
  mapsLink: string;
  instagram: string;
  linkedin: string;
  activity: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface AdvancedSearchParams {
  sector?: string;
  city?: string;
  state?: string;
  minCapital?: number;
  maxCapital?: number;
  minEmployees?: number;
  activity?: string;
}
