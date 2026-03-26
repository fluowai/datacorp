
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

export interface WhatsAppGroup {
  name: string;
  platform: 'Instagram' | 'Facebook' | 'Google' | 'LinkedIn';
  link: string;
  description: string;
  foundAt: string;
}

export type ViewType = 'dashboard' | 'search' | 'analytics' | 'favorites' | 'biddings' | 'lead_scan' | 'whatsapp_groups' | 'settings';

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
