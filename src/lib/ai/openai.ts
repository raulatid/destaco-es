import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as { openai?: OpenAI };

/** Cliente de OpenAI (singleton). Lanza error si falta la clave. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en el entorno.");
  }
  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({ apiKey });
  }
  return globalForOpenAI.openai;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
