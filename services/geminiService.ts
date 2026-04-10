
import { GoogleGenAI } from "@google/genai";

const getAI = (apiKey?: string) => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || '' });
};

/**
 * Consulta de Auditoria Real via Google Search Grounding
 * Focada em extrair dados profundos, incluindo quadro societário detalhado.
 */
export const fetchPublicDataReport = async (identifier: string, query: string, type: 'EMPRESA' | 'PESSOA' = 'EMPRESA', apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const prompt = `REALIZE UMA INVESTIGAÇÃO EXAUSTIVA E MULTIDIMENSIONAL OSINT PARA ${type}: ${query} (${identifier}).
    
    FONTES OBRIGATÓRIAS E ESTRATÉGIA DE BUSCA:
    ${type === 'EMPRESA' ? `
    - Realize buscas cruzadas em portais de transparência, Juntas Comerciais (JUCESP, JUCERJA, etc.) e agregadores de CNPJ (Casa dos Dados, CNPJ.biz, Econodata).
    - Busque por filiais, histórico de capital social e alterações contratuais.
    ` : `
    - PESQUISA DE SOCIEDADES: Busque o nome associado a este CPF em portais de transparência societária para identificar participações em empresas (QSA).
    - PESQUISA JURÍDICA: Realize buscas profundas no Jusbrasil, Escavador, e sites de Tribunais (TJ, TRF, TRT) buscando pelo nome completo e variações.
    - PESQUISA DE BENS E PADRÃO: Busque menções em Diários Oficiais sobre leilões, posses ou nomeações.
    `}
    - Pesquisa exaustiva no Google utilizando operadores avançados para encontrar menções em PDFs, editais e notícias.

    ESTRUTURE O RELATÓRIO EXATAMENTE COM ESTAS MARCAÇÕES:

    #SECAO_RESUMO#
    [Resumo executivo detalhado. Se o alvo for sócio de empresas ou possuir processos, destaque o volume e a relevância logo aqui.]
    NÍVEL_DE_RISCO: [BAIXO | MÉDIO | ALTO | INDETERMINADO]

    #SECAO_DADOS#
    [Dados cadastrais confirmados. Inclua o nome completo e a situação cadastral se encontrada.]

    #SECAO_SOCIOS#
    [VÍNCULOS SOCIETÁRIOS: Liste TODAS as empresas onde o alvo aparece como sócio, administrador ou beneficiário. Informe Razão Social e CNPJ se encontrados.]

    #SECAO_JURIDICO#
    [HISTÓRICO JUDICIAL: Liste processos encontrados, tribunais, classes processuais e o papel do alvo (Autor/Réu). Não omita processos encontrados em Diários Oficiais.]

    #SECAO_SOCIAL#
    [Pegada digital e perfis profissionais (LinkedIn) que confirmem a atuação do alvo.]

    #SECAO_NOTICIAS#
    [Menções em portais de notícias, editais ou comunicados oficiais.]

    REGRAS DE OURO (MÁXIMA PRECISÃO):
    1. INVESTIGAÇÃO PROFUNDA: Não pare no primeiro resultado. Cruze os dados para confirmar se o "João Silva" do processo é o mesmo "João Silva" sócio da empresa X.
    2. GROUNDING TOTAL: Utilize cada link retornado pela busca para extrair o máximo de detalhes.
    3. Se houver muitos processos ou muitas empresas, tente listar os mais recentes ou relevantes.
    4. NUNCA invente dados, mas seja persistente na extração do que é público.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `Você é um Investigador OSINT de elite especializado em Compliance e Due Diligence. 
        Sua missão é encontrar vínculos ocultos, participações societárias e histórico jurídico. 
        Você deve ser exaustivo na análise dos resultados de busca. 
        Se um CPF é sócio de várias empresas, você DEVE listar essas empresas. 
        Se há processos, você DEVE detalhar o que foi encontrado nos tribunais ou diários oficiais. 
        Mantenha o rigor técnico e a veracidade absoluta.`,
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Fonte Consultada',
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return {
      text: response.text,
      sources: sources
    };
  } catch (error) {
    console.error("Audit Search Error:", error);
    throw error;
  }
};

/**
 * Enriquecimento de Lead via OSINT (Busca de CNPJ e Sócios)
 */
export const enrichLeadData = async (companyName: string, address: string, apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const prompt = `REALIZE O ENRIQUECIMENTO DE DADOS PARA A EMPRESA: "${companyName}" LOCALIZADA EM "${address}".
    
    OBJETIVO:
    1. Encontrar o CNPJ exato desta unidade ou da matriz.
    2. Identificar o Quadro de Sócios e Administradores (QSA).
    3. Verificar o Capital Social.

    FORMATE A RESPOSTA EXATAMENTE ASSIM:
    ---ENRICH_START---
    CNPJ: [Número do CNPJ]
    SOCIOS: [Nome dos sócios separados por vírgula]
    CAPITAL: [Valor do Capital Social]
    SITUACAO: [Ativa/Inativa]
    ABERTURA: [Data de abertura]
    ATIVIDADE: [Descrição da atividade principal]
    ---ENRICH_END---
    
    Se não encontrar o CNPJ exato, tente encontrar a empresa mais próxima pelo nome e endereço.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um especialista em enriquecimento de dados cadastrais brasileiros. Seu objetivo é cruzar nomes de estabelecimentos com bases de dados de CNPJ públicas.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Enrichment Error:", error);
    throw error;
  }
};

/**
 * Mineração de Dados de Estabelecimentos via Google Maps Grounding
 */
export const fetchGoogleMapsStream = async (query: string, limit: number = 10, apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const prompt = `BUSCA DE ESTABELECIMENTOS REAIS NO GOOGLE MAPS PARA: ${query}.
    
    DIRETRIZES:
    - Encontre exatamente ${limit} locais reais, com endereços e avaliações.
    - Extraia o máximo de detalhes de contato (telefone, site).
    - Tente encontrar links de redes sociais (Instagram, Facebook, LinkedIn) para cada local.
    
    FORMATE CADA LOCAL ASSIM:
    ---PLACE_START---
    NOME: [Nome do local]
    ENDERECO: [Endereço completo]
    AVALIACAO: [Nota de 0 a 5]
    REVIEWS: [Quantidade de avaliações]
    TELEFONE: [Telefone de contato]
    SITE: [URL do site oficial]
    CATEGORIA: [Tipo de estabelecimento]
    MAPS_LINK: [Link direto para o Google Maps]
    INSTAGRAM: [Link do Instagram se encontrado]
    FACEBOOK: [Link do Facebook se encontrado]
    LINKEDIN: [Link do LinkedIn se encontrado]
    ---PLACE_END---`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um especialista em prospecção local. Seu objetivo é encontrar estabelecimentos reais no Google Maps e extrair seus dados públicos.",
      }
    });
  } catch (error) {
    console.error("Google Maps Search Error:", error);
    throw error;
  }
};

/**
 * Busca de Perfis de Instagram de Empresas por Nicho
 */
export const fetchInstagramProfiles = async (niche: string, limit: number = 10, apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const prompt = `BUSCA DE PERFIS DE INSTAGRAM DE EMPRESAS PARA O NICHO: ${niche}.
    
    DIRETRIZES:
    - Encontre exatamente ${limit} perfis reais de empresas ou profissionais no Instagram.
    - Extraia dados públicos como username, nome completo, bio e métricas estimadas.
    
    FORMATE CADA PERFIL ASSIM:
    ---INSTA_START---
    USERNAME: [username sem @]
    NOME: [Nome completo ou da empresa]
    BIO: [Breve descrição da bio]
    SEGUIDORES: [Quantidade de seguidores]
    SEGUINDO: [Quantidade de perfis que segue]
    POSTS: [Quantidade de publicações]
    LINK: [URL direta do perfil]
    BUSINESS: [TRUE | FALSE]
    CATEGORIA: [Nicho/Categoria]
    ---INSTA_END---`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um especialista em OSINT para redes sociais. Seu objetivo é encontrar perfis comerciais relevantes no Instagram.",
      }
    });
  } catch (error) {
    console.error("Instagram Search Error:", error);
    throw error;
  }
};

/**
 * Busca e Validação de Grupos de WhatsApp
 */
export const fetchWhatsAppGroups = async (query: string, limit: number = 10, apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const prompt = `BUSCA DE GRUPOS DE WHATSAPP PARA: ${query}.
    
    DIRETRIZES:
    - Encontre links de convite de grupos de WhatsApp reais (chat.whatsapp.com).
    - Valide se o link parece legítimo e extraia o nome e descrição do grupo.
    
    FORMATE CADA GRUPO ASSIM:
    ---WA_START---
    NOME: [Nome do Grupo]
    LINK: [Link de convite completo]
    DESCRICAO: [Descrição do que se trata o grupo]
    PARTICIPANTES: [Estimativa de participantes se disponível]
    VALIDO: [TRUE | FALSE]
    ---WA_END---`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um especialista em encontrar comunidades online. Seu objetivo é localizar grupos de WhatsApp ativos e relevantes.",
      }
    });
  } catch (error) {
    console.error("WhatsApp Search Error:", error);
    throw error;
  }
};

/**
 * Busca de Empresas por CNAE e Capital Social via Google Search Grounding
 */
export const fetchCompaniesByCnaeStream = async (cnae: string, minCapital: number, city: string, limit: number = 10, apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const prompt = `REALIZE UMA BUSCA EXAUSTIVA NO GOOGLE PARA ENCONTRAR EMPRESAS REAIS.
    
    CRITÉRIOS DE BUSCA:
    - CNAE/ATIVIDADE: "${cnae}"
    - CAPITAL SOCIAL MÍNIMO: R$ ${minCapital}
    - LOCALIZAÇÃO: "${city}"
    
    INSTRUÇÕES DE PESQUISA (GROUNDING):
    1. Pesquise em diretórios de empresas como "Casa dos Dados", "CNPJ.biz", "Econodata", "Empresas do Brasil".
    2. Use termos de busca como "site:casadosdados.com.br ${cnae} ${city} capital social" ou "site:cnpj.biz ${cnae} ${city}".
    3. Identifique empresas que atendam ao critério de capital social informado.
    4. Para cada empresa encontrada, busque também seu perfil no Instagram, LinkedIn e, principalmente, sua ficha no Google Maps para extrair o telefone de contato real.

    QUANTIDADE: Encontre exatamente ${limit} empresas.

    FORMATE CADA EMPRESA EXATAMENTE ASSIM (MANTENHA OS PREFIXOS):
    ---COMPANY_START---
    NOME: [Razão Social ou Nome Fantasia]
    CNPJ: [Número do CNPJ formatado]
    CAPITAL: [Valor do Capital Social formatado ex: R$ 500.000,00]
    SOCIOS: [Nomes dos sócios e administradores]
    ENDERECO: [Endereço completo com CEP]
    TELEFONE: [Telefone com DDD]
    SITE: [URL do site oficial]
    MAPS: [Link direto do Google Maps]
    INSTAGRAM: [Link do perfil no Instagram]
    LINKEDIN: [Link do perfil no LinkedIn]
    ATIVIDADE: [Descrição da atividade principal/CNAE]
    ---COMPANY_END---
    
    IMPORTANTE: Se não encontrar o capital social exato, informe o valor mais aproximado encontrado em fontes públicas.`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um analista OSINT especializado em prospecção B2B. Sua missão é 'raspar' virtualmente o Google Search para encontrar dados cadastrais e financeiros de empresas brasileiras de forma precisa.",
      }
    });
  } catch (error) {
    console.error("CNAE Search Error:", error);
    throw error;
  }
};

/**
 * Busca Avançada de Empresas com filtros múltiplos via Google Search Grounding
 */
export const fetchAdvancedSearchStream = async (params: any, limit: number = 10, apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const { sector, city, state, minCapital, maxCapital, minEmployees, activity } = params;
    
    const prompt = `REALIZE UMA BUSCA AVANÇADA DE EMPRESAS REAIS COM OS SEGUINTES FILTROS:
    ${sector ? `- SETOR: ${sector}` : ''}
    ${city ? `- CIDADE: ${city}` : ''}
    ${state ? `- ESTADO: ${state}` : ''}
    ${minCapital ? `- CAPITAL SOCIAL MÍNIMO: R$ ${minCapital}` : ''}
    ${maxCapital ? `- CAPITAL SOCIAL MÁXIMO: R$ ${maxCapital}` : ''}
    ${minEmployees ? `- MÍNIMO DE FUNCIONÁRIOS: ${minEmployees}` : ''}
    ${activity ? `- ATIVIDADE/CNAE: ${activity}` : ''}
    
    INSTRUÇÕES:
    1. Utilize fontes como Casa dos Dados, CNPJ.biz, Econodata e LinkedIn.
    2. Identifique empresas que se encaixem no perfil solicitado.
    3. Extraia CNPJ, Capital Social, Sócios, Endereço, Redes Sociais e o Telefone de contato (preferencialmente da ficha do Google Maps).
    
    QUANTIDADE: Encontre exatamente ${limit} empresas.

    FORMATE CADA EMPRESA EXATAMENTE ASSIM:
    ---COMPANY_START---
    NOME: [Razão Social ou Nome Fantasia]
    CNPJ: [Número do CNPJ]
    CAPITAL: [Valor do Capital Social]
    SOCIOS: [Nomes dos sócios]
    ENDERECO: [Endereço completo]
    TELEFONE: [Telefone]
    SITE: [URL do site]
    MAPS: [Link do Google Maps]
    INSTAGRAM: [Link do Instagram]
    LINKEDIN: [Link do LinkedIn]
    ATIVIDADE: [Descrição da atividade]
    FATURAMENTO_ESTIMADO: [Faixa de faturamento se disponível]
    FUNCIONARIOS: [Número estimado de funcionários]
    ---COMPANY_END---`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um especialista em inteligência de mercado e prospecção B2B avançada.",
      }
    });
  } catch (error) {
    console.error("Advanced Search Error:", error);
    throw error;
  }
};
