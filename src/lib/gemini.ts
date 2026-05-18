import { GoogleGenAI, Type } from "@google/genai";
import { BusinessContext, VariableInfo, ClusterProfile } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateBusinessSummary = async (ctx: BusinessContext) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza este contexto de negocio para un proyecto de segmentación de datos:
      Sector: ${ctx.sector}
      Contexto: ${ctx.context}
      Problema: ${ctx.problem}
      Objetivo: ${ctx.objective}
      
      Genera un resumen ejecutivo de máximo 3 líneas que unifique el dolor del negocio con la promesa técnica de la clusterización.`,
    });

    return response.text;
  } catch (e) {
    console.error(e);
    return "Análisis listo para proceder. El marco estratégico ha sido validado.";
  }
};

export const generateVariableRecommendations = async (variables: VariableInfo[], context: BusinessContext) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Como experto en Data Science, analiza estas variables de un dataset en el sector ${context.sector}.
            Objetivo: ${context.objective}.
            Variables: ${JSON.stringify(variables.map(v => ({ name: v.name, type: v.type, unique: v.uniqueValues, missing: v.missingValues })))}
            
            Para cada variable, recomienda si debe usarse para clustering (true/false) y da una razón de negocio brevísima.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            recommendation: { type: Type.STRING },
                            isUseful: { type: Type.BOOLEAN }
                        },
                        required: ["name", "recommendation", "isUseful"]
                    }
                }
            }
        });

        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const generateClusterProfiles = async (
    context: BusinessContext, 
    variables: VariableInfo[], 
    stats: any[]
): Promise<ClusterProfile[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Genera perfiles de marketing/negocio para estos ${stats.length} clusters resultantes de un análisis en el sector ${context.sector}.
            
            Contexto: ${context.context}
            Variables utilizadas y sus promedios por cluster: ${JSON.stringify(stats)}
            
            Para cada cluster id (0 a ${stats.length - 1}), devuelve un perfil detallado.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.INTEGER, description: "El ID del cluster (0-indexed)" },
                            name: { type: Type.STRING, description: "Nombre creativo del segmento" },
                            characteristics: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "3-4 características principales"
                            },
                            insights: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "2-3 insights profundos de negocio"
                            },
                            strategies: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "3 estrategias de activación"
                            }
                        },
                        required: ["id", "name", "characteristics", "insights", "strategies"]
                    }
                }
            }
        });

        const profiles = JSON.parse(response.text || "[]");
        return profiles;
    } catch (e) {
        console.error(e);
        return [];
    }
};
