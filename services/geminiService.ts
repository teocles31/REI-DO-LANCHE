import { GoogleGenAI } from "@google/genai";
import { DashboardStats, Revenue, Expense } from "../types";

// Note: In a real environment, the API key should be in process.env.API_KEY
// and managed securely.
const getClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateFinancialAnalysis = async (
  stats: DashboardStats,
  recentSales: Revenue[],
  recentExpenses: Expense[]
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Chave de API não configurada. Adicione process.env.API_KEY para usar a IA.";

  const prompt = `
    Atue como um consultor financeiro sênior especializado em restaurantes e hamburguerias.
    Analise os seguintes dados da minha hamburgueria e forneça 3 insights curtos e práticos para melhorar o lucro.
    
    Dados atuais:
    - Receita Total: R$ ${stats.revenue}
    - Despesas Totais: R$ ${stats.expenses}
    - Lucro Líquido: R$ ${stats.profit}
    - Margem Atual: ${stats.margin}%
    
    Responda em português, usando formatação markdown simples. Seja direto.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar análise no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a IA Consultora.";
  }
};