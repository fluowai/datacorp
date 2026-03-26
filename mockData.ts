
import { Company } from './types';

export const MOCK_COMPANIES: Company[] = [
  {
    id: '1',
    cnpj: '12.345.678/0001-90',
    legalName: 'TECNOLOGIA E INOVACAO LTDA',
    tradeName: 'TechNova Solutions',
    status: 'Ativa',
    openingDate: '2015-05-20',
    capital: 500000,
    cnae: '6201-5/01',
    cnaeDescription: 'Desenvolvimento de programas de computador',
    nature: 'Sociedade Empresária Limitada',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    partners: [
      { name: 'Ricardo Santos', role: 'Sócio-Administrador', shareCapital: 300000 },
      { name: 'Maria Oliveira', role: 'Sócio', shareCapital: 200000 }
    ],
    contact: { email: 'contato@technova.com.br', phone: '(11) 3214-5555' },
    financialHistory: [
      { year: 2021, revenue: 1200000, profit: 200000 },
      { year: 2022, revenue: 1500000, profit: 350000 },
      { year: 2023, revenue: 2100000, profit: 580000 },
    ],
    competitors: ['SoftPlus', 'DevDynamics', 'CloudCorp'],
    recentNews: [
      { date: '2023-10-15', title: 'TechNova expande operações para o Chile', source: 'Valor Econômico', link: '#' },
      { date: '2023-08-01', title: 'Empresa recebe aporte de R$ 5M para IA', source: 'Exame', link: '#' }
    ],
    metrics: { employees: 45, growth: 22.5, marketShare: 0.8 }
  },
  {
    id: '2',
    cnpj: '98.765.432/0001-11',
    legalName: 'LOGISTICA RAPIDA S.A.',
    tradeName: 'LogExpress',
    status: 'Ativa',
    openingDate: '2010-11-12',
    capital: 2500000,
    cnae: '4930-2/02',
    cnaeDescription: 'Transporte rodoviário de carga',
    nature: 'Sociedade Anônima Fechada',
    address: {
      street: 'Rua das Industrias',
      number: '450',
      neighborhood: 'Distrito Industrial',
      city: 'Curitiba',
      state: 'PR',
      zipCode: '80000-000'
    },
    partners: [
      { name: 'André Luiz', role: 'Diretor', shareCapital: 1000000 },
      { name: 'Investimentos Sul S.A.', role: 'Sócio Pessoa Jurídica', shareCapital: 1500000 }
    ],
    contact: { email: 'financeiro@logexpress.com.br', phone: '(41) 3333-4444' },
    financialHistory: [
      { year: 2021, revenue: 8500000, profit: 1200000 },
      { year: 2022, revenue: 9200000, profit: 1100000 },
      { year: 2023, revenue: 11000000, profit: 1800000 },
    ],
    competitors: ['Rapido BR', 'TransSul', 'CargaVix'],
    recentNews: [
      { date: '2023-09-20', title: 'Novas rotas no Nordeste prometem entrega em 24h', source: 'Folha', link: '#' }
    ],
    metrics: { employees: 250, growth: 15.0, marketShare: 3.2 }
  },
  {
    id: '3',
    cnpj: '45.123.789/0001-00',
    legalName: 'AGROVIVA SOLUCOES AGRICOLAS LTDA',
    tradeName: 'AgroViva',
    status: 'Ativa',
    openingDate: '2018-03-05',
    capital: 1200000,
    cnae: '0161-0/03',
    cnaeDescription: 'Serviços de cultivo e colheita',
    nature: 'Sociedade Empresária Limitada',
    address: {
      street: 'Rodovia BR-163',
      number: 'KM 240',
      neighborhood: 'Rural',
      city: 'Sorriso',
      state: 'MT',
      zipCode: '78890-000'
    },
    partners: [{ name: 'João Fertile', role: 'Sócio-Administrador', shareCapital: 1200000 }],
    contact: { email: 'atendimento@agroviva.agr.br', phone: '(66) 99999-8888' },
    financialHistory: [
      { year: 2021, revenue: 4000000, profit: 900000 },
      { year: 2022, revenue: 5200000, profit: 1300000 },
      { year: 2023, revenue: 6800000, profit: 1950000 },
    ],
    competitors: ['TerraNova', 'SafraPlus'],
    recentNews: [
      { date: '2023-11-05', title: 'AgroViva investe em drones agrícolas', source: 'Globo Rural', link: '#' }
    ],
    metrics: { employees: 80, growth: 30.5, marketShare: 1.2 }
  },
  {
    id: '4',
    cnpj: '33.444.555/0001-22',
    legalName: 'REDE VAREJO S.A.',
    tradeName: 'SuperVarejo',
    status: 'Inativa',
    openingDate: '1995-08-15',
    capital: 15000000,
    cnae: '4711-3/02',
    cnaeDescription: 'Supermercados',
    nature: 'Sociedade Anônima Aberta',
    address: {
      street: 'Rua do Comercio',
      number: '10',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20000-001'
    },
    partners: [{ name: 'Carlos Grande', role: 'Presidente', shareCapital: 15000000 }],
    contact: { email: 'comercial@supervarejo.com.br', phone: '(21) 2222-3333' },
    financialHistory: [
      { year: 2021, revenue: 45000000, profit: -2000000 },
      { year: 2022, revenue: 38000000, profit: -5000000 },
      { year: 2023, revenue: 20000000, profit: -8000000 },
    ],
    competitors: ['Carrefour', 'Pão de Açúcar'],
    recentNews: [
      { date: '2023-12-01', title: 'SuperVarejo anuncia fechamento de 10 lojas', source: 'G1', link: '#' }
    ],
    metrics: { employees: 1200, growth: -40.0, marketShare: 0.5 }
  }
];
