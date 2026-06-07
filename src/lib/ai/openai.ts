import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as { openai?: OpenAI };

/** Cliente de OpenAI (singleton). Lanza error si falta la clave. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en el entorno.");
  }
  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({
      apiKey,
      // El SDK por defecto espera hasta 600 s y reintenta 2 veces: bajo limite
      // de cuota una llamada puede quedarse colgada minutos y agotar el tiempo
      // de la funcion serverless del import diario. Acotamos a 45 s/llamada y 1
      // reintento para fallar rapido (el enriquecimiento es best-effort).
      timeout: 45_000,
      maxRetries: 1,
    });
  }
  return globalForOpenAI.openai;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
