
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
    
    ESTRATÉGIA DE BUSCA (EXECUTE ESTAS CONSULTAS NO GOOGLE SEARCH):
    1. "${identifier} sócio"
    2. "${identifier} processos"
    3. "${identifier} jusbrasil"
    4. "${identifier} escavador"
    5. "${identifier} quadro societário"
    6. "${identifier} capital social"
    7. "${identifier} consulta cnpj" (se for empresa)
    8. "${identifier} diário oficial"

    FONTES OBRIGATÓRIAS:
    ${type === 'EMPRESA' ? `
    - Realize buscas cruzadas em portais de transparência, Juntas Comerciais (JUCESP, JUCERJA, etc.) e agregadores de CNPJ (Casa dos Dados, CNPJ.biz, Econodata).
    - Busque por filiais, histórico de capital social e alterações contratuais.
    ` : `
    - PESQUISA DE SOCIEDADES: Busque o nome associado a este CPF em portais de transparência societária para identificar participações em empresas (QSA).
    - PESQUISA JURÍDICA: Realize buscas profundas no Jusbrasil, Escavador, e sites de Tribunais (TJ, TRF, TRT) buscando pelo nome completo e variações.
    - PESQUISA DE BENS E PADRÃO: Busque menções em Diários Oficiais sobre leilões, posses ou nomeações.
    `}
    - Pesquisa exaustiva no Google utilizando operadores avançados para encontrar menções em PDFs, editais e notícias.

    DIRETRIZ DE VERACIDADE (CRÍTICO):
    1. PROIBIDO ALUCINAR: Se não encontrar dados reais para o identificador "${identifier}", responda explicitamente: "Nenhum dado público encontrado para este identificador".
    2. CITAÇÃO DE FONTES: Para cada bloco de informação, mencione a fonte e inclua o link direto se disponível (ex: "Fonte: Jusbrasil [link]", "Fonte: Casa dos Dados [link]").
    3. RIGOR DE IDENTIDADE: Certifique-se de que os dados pertencem ao alvo. Não confunda homônimos.
    4. LINKS REAIS: Sempre que citar um processo ou registro, tente fornecer o link da fonte.

    ESTRUTURE O RELATÓRIO EXATAMENTE COM ESTAS MARCAÇÕES:

    #SECAO_RESUMO#
    [Resumo executivo baseado APENAS em fatos encontrados. Se nada for encontrado, informe aqui.]
    NÍVEL_DE_RISCO: [BAIXO | MÉDIO | ALTO | INDETERMINADO]

    #SECAO_DADOS#
    [Dados cadastrais confirmados via fontes oficiais.]

    #SECAO_SOCIOS#
    [VÍNCULOS SOCIETÁRIOS REAIS: Liste empresas onde o alvo é sócio/admin. Se não houver, diga "Nenhum vínculo societário encontrado".]

    #SECAO_JURIDICO#
    [HISTÓRICO JUDICIAL REAL: Liste processos com número, tribunal e partes. Se não houver, diga "Nenhum processo judicial encontrado".]

    #SECAO_SOCIAL#
    [Pegada digital confirmada (LinkedIn, sites profissionais).]

    #SECAO_NOTICIAS#
    [Menções em notícias ou diários oficiais.]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `Você é um Investigador OSINT de elite. 
        Sua prioridade número 1 é a VERACIDADE. 
        Você prefere dizer que não encontrou nada do que fornecer um dado incerto ou falso. 
        Analise os resultados do Google Search com extremo rigor. 
        Se o usuário fornecer um CPF ou CNPJ, use-o como âncora para validar todas as informações. 
        Não invente dados. Se os resultados da busca forem genéricos, informe que os dados são inconclusivos.`,
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

    DIRETRIZ DE PRECISÃO:
    - BUSCA REAL: Use o Google Search para encontrar a ficha da empresa em sites como Casa dos Dados, CNPJ.biz ou Econodata.
    - NÃO ALUCINE: Se não encontrar o CNPJ ou os sócios reais, deixe os campos em branco ou informe "Não encontrado".
    - VALIDAÇÃO: Certifique-se de que a empresa encontrada no endereço "${address}" é a mesma solicitada.

    FORMATE A RESPOSTA EXATAMENTE ASSIM:
    ---ENRICH_START---
    CNPJ: [Número do CNPJ]
    SOCIOS: [Nome dos sócios separados por vírgula]
    CAPITAL: [Valor do Capital Social]
    SITUACAO: [Ativa/Inativa]
    ABERTURA: [Data de abertura]
    ATIVIDADE: [Descrição da atividade principal]
    ---ENRICH_END---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um especialista em enriquecimento de dados cadastrais brasileiros. Sua missão é fornecer dados REAIS e ATUALIZADOS. Se não tiver certeza de um dado, não o invente.",
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
    
    INSTRUÇÕES CRÍTICAS DE LOCALIZAÇÃO:
    1. Foque EXCLUSIVAMENTE em resultados dentro da região solicitada (${query}).
    2. Verifique o endereço de cada local para garantir que pertence à cidade/estado corretos.
    3. Ignore resultados patrocinados ou de outras regiões que o Google possa sugerir.
    4. Encontre exatamente ${limit} locais reais, com endereços e avaliações.
    5. Extraia o máximo de detalhes de contato (telefone, site).
    
    FORMATE CADA LOCAL ASSIM:
    ---PLACE_START---
    NOME: [Nome do local]
    ENDERECO: [Endereço completo]
    AVALIACAO: [Nota de 0 a 5]
    REVIEWS: [Quantidade de avaliações]
    TELEFONE: [Telefone de contato]
    SITE: [URL do site oficial]
    CATEGORIA: [Tipo de estabelecimento]
    MAPS_LINK: [Link direto da ficha da empresa no Google - ex: https://www.google.com/search?q=NOME+DA+EMPRESA+ENDERECO ou link curto de compartilhamento do Maps]
    INSTAGRAM: [Link do Instagram se encontrado]
    FACEBOOK: [Link do Facebook se encontrado]
    LINKEDIN: [Link do LinkedIn se encontrado]
    ---PLACE_END---`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um especialista em prospecção local via Google Maps. Sua missão é localizar estabelecimentos REAIS e ATIVOS na região exata solicitada. Você deve validar o endereço de cada resultado antes de incluí-lo. SEMPRE forneça o link que abra diretamente a ficha da empresa no Google (Knowledge Panel/Business Profile).",
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
    const prompt = `REALIZE UMA BUSCA EXAUSTIVA DE GRUPOS DE WHATSAPP PARA: "${query}".
    
    ESTRATÉGIA DE BUSCA (GROUNDING):
    1. Pesquise links de convite (chat.whatsapp.com) em:
       - Instagram (perfis e posts)
       - Facebook (grupos e páginas)
       - LinkedIn (posts e artigos)
       - Google (sites de nicho e diretórios)
    2. Use operadores como: "site:instagram.com chat.whatsapp.com ${query}", "site:facebook.com chat.whatsapp.com ${query}", etc.
    
    DIRETRIZES:
    - Encontre links de convite de grupos de WhatsApp reais.
    - Identifique a PLATAFORMA de origem onde o link foi encontrado.
    - Extraia o nome e uma breve descrição do propósito do grupo.
    
    FORMATE CADA GRUPO EXATAMENTE ASSIM:
    ---WA_START---
    NOME: [Nome do Grupo]
    LINK: [Link de convite completo]
    DESCRICAO: [Descrição do que se trata o grupo]
    PLATAFORMA: [Instagram | Facebook | LinkedIn | Google | Outro]
    PARTICIPANTES: [Estimativa se disponível]
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
    MAPS: [Link que abra a ficha da empresa no Google - ex: https://www.google.com/search?q=Nome+Da+Empresa+Endereco ou link de compartilhamento curto]
    INSTAGRAM: [Link do perfil no Instagram]
    LINKEDIN: [Link do perfil no LinkedIn]
    ATIVIDADE: [Descrição da atividade principal/CNAE]
    ---COMPANY_END---
    
    IMPORTANTE: 
    - Se não encontrar uma empresa que atenda aos critérios, NÃO invente dados. 
    - Se algum campo (como telefone ou site) não for encontrado, deixe em branco ou escreva "Não localizado".
    - PRIORIZE dados da ficha do Google Business para contatos.`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um analista OSINT especializado em prospecção B2B. Sua missão é encontrar dados cadastrais e financeiros de empresas brasileiras de forma precisa e verificável. Nunca invente dados. SEMPRE forneça links que abram a ficha da empresa no Google (Google Business Profile).",
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
    MAPS: [Link que abra a ficha da empresa no Google - ex: https://www.google.com/search?q=Nome+Da+Empresa+Endereco ou link de compartilhamento curto]
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
        systemInstruction: "Você é um especialista em inteligência de mercado e prospecção B2B avançada. Sua missão é localizar empresas reais e fornecer links que abram suas fichas no Google e perfis sociais.",
      }
    });
  } catch (error) {
    console.error("Advanced Search Error:", error);
    throw error;
  }
};

/**
 * Escaneamento de Leads em Tempo Real (Streaming)
 */
export const scanCompaniesStream = async (params: any, apiKey?: string) => {
  try {
    const ai = getAI(apiKey);
    const { uf, city, cnae, cep, limit } = params;
    
    const prompt = `REALIZE UM ESCANEAMENTO DE LEADS EM TEMPO REAL PARA:
    - UF: ${uf || 'Qualquer'}
    - CIDADE: ${city || 'Qualquer'}
    - CNAE: ${cnae || 'Qualquer'}
    - CEP: ${cep || 'Qualquer'}
    
    INSTRUÇÕES:
    1. Encontre exatamente ${limit} empresas reais.
    2. Priorize dados da "Casa dos Dados" para CNPJ e Sócios.
    3. Priorize dados do "Google Business" para Telefone e Site.
    4. Se não encontrar, deixe em branco.
    
    FORMATE CADA LEAD ASSIM:
    ---LEAD_START---
    NOME: [Nome da Empresa]
    CNPJ: [CNPJ]
    ENDERECO: [Endereço]
    SOCIOS: [Sócios separados por vírgula]
    TELEFONES: [Telefones separados por vírgula]
    MAPS: [Link que abra a ficha da empresa no Google - ex: https://www.google.com/search?q=Nome+Da+Empresa+Endereco ou link de compartilhamento curto]
    FONTE: [Link da fonte dos dados]
    ATIVIDADE: [Atividade Principal]
    CAPITAL: [Capital Social]
    ---LEAD_END---`;

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um robô de mineração de leads B2B de alta precisão. Sua prioridade é a validade dos links de contato e localização (Ficha do Google Business).",
      }
    });
  } catch (error) {
    console.error("Scan Error:", error);
    throw error;
  }
};
