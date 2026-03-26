
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Consulta de Auditoria Real via Google Search Grounding
 * Focada em extrair dados profundos, incluindo quadro societário detalhado.
 */
export const fetchPublicDataReport = async (identifier: string, query: string, type: 'EMPRESA' | 'PESSOA' = 'EMPRESA') => {
  try {
    const prompt = `REALIZE UMA INVESTIGAÇÃO PROFUNDA OSINT PARA: ${query} (${identifier}).
    
    FONTES OBRIGATÓRIAS:
    - Portais de transparência, Juntas Comerciais e portais de CNPJ.
    - Jusbrasil, Escavador e Diários Oficiais.
    - Redes Sociais (LinkedIn, Instagram) e Google Business.

    ESTRUTURE O RELATÓRIO EXATAMENTE COM ESTAS MARCAÇÕES:

    #SECAO_RESUMO#
    [Resumo executivo com análise de risco]
    NÍVEL_DE_RISCO: [BAIXO | MÉDIO | ALTO]

    #SECAO_DADOS#
    [Dados básicos, CNPJ, Data de Abertura, Natureza Jurídica]

    #SECAO_SOCIOS#
    [QUADRO SOCIETÁRIO DETALHADO: Liste cada sócio e, se disponível, sua participação/capital social estimado]

    #SECAO_JURIDICO#
    [Processos judiciais, tribunais e status]

    #SECAO_SOCIAL#
    [Pegada digital, links de perfis e engajamento]

    #SECAO_NOTICIAS#
    [Menções na mídia e reputação]

    REGRAS:
    - Extraia o máximo de detalhes sobre o Capital Social e quem são os beneficiários finais.
    - Se encontrar participação percentual dos sócios, descreva claramente.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um analista de inteligência OSINT sênior. Seu objetivo é cruzar dados públicos para gerar dossiês de alta fidelidade.",
        thinkingConfig: { thinkingBudget: 0 }
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
 * Mineração de Links de Grupos de WhatsApp via OSINT (Google, Instagram, Facebook, LinkedIn)
 */
export const fetchWhatsAppGroupsStream = async (keyword: string) => {
  try {
    const prompt = `MINERAÇÃO DE LINKS DE GRUPOS DE WHATSAPP (chat.whatsapp.com) REAIS PARA O NICHO: ${keyword}.
    
    DIRETRIZES DE BUSCA:
    - Instagram: Procure por links na bio ou em posts indexados.
    - Facebook: Procure em grupos públicos e posts de páginas.
    - LinkedIn: Procure em posts de networking e comunidades.
    - Google: Use dorks para encontrar convites expostos.

    EXTRAIA OS DADOS E FORMATE ASSIM:
    ---GROUP_START---
    NOME: [Título real do grupo ou contexto do convite]
    PLATAFORMA: [Identifique se veio do Instagram, Facebook, Google ou LinkedIn]
    LINK: [Link chat.whatsapp.com completo e válido]
    DESC: [Resumo do que se trata o grupo baseado no contexto da postagem]
    ORIGEM: [URL exata da postagem/perfil onde o link foi encontrado]
    ---GROUP_END---
    
    FOQUE APENAS EM LINKS REAIS E RECENTES.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um robô minerador de leads sociais. Seu trabalho é varrer a internet em busca de links de convite para grupos de WhatsApp ativos.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return responseStream;
  } catch (error) {
    console.error("WhatsApp Mining Error:", error);
    throw error;
  }
};

export const scanCompaniesStream = async (uf: string, city: string, cnae: string, cep: string, limit: number, minCapital?: string) => {
  try {
    const prompt = `VARREDURA DE LEADS B2B: ${limit} empresas em ${city}/${uf}, setor ${cnae}.`;
    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Extraia leads estruturados em blocos ---LEAD_START--- e ---LEAD_END---.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
  } catch (error) { throw error; }
};

export const fetchBiddingsStream = async (keyword: string) => {
  try {
    const prompt = `BUSCA DE LICITAÇÕES REAIS: ${keyword}.`;
    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Extraia licitações em blocos ---BID_START--- e ---BID_END---.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
  } catch (error) { throw error; }
};
