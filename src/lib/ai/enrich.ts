import { z } from "zod";

import { getOpenAI, OPENAI_MODEL } from "./openai";

export interface EnrichInput {
  name: string;
  categoryName: string;
  city?: string | null;
  province?: string | null;
  website?: string | null;
  existingDescription?: string | null;
  existingServices?: string[];
}

const EnrichmentSchema = z.object({
  shortDescription: z.string().min(10),
  description: z.string().min(40),
  professionalProfile: z.string().min(40),
  services: z
    .array(z.object({ name: z.string(), description: z.string() }))
    .min(1),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
  keywords: z.array(z.string()).min(1),
  metaTitle: z.string().min(5),
  metaDescription: z.string().min(20),
});

export type Enrichment = z.infer<typeof EnrichmentSchema>;

const SYSTEM_PROMPT =
  "Eres un redactor profesional especializado en SEO local y directorios de " +
  "empresas en España. Escribes en español de España, con un tono profesional, " +
  "claro y cercano. Devuelves SIEMPRE un único objeto JSON válido, sin texto extra.";

function buildUserPrompt(input: EnrichInput): string {
  const location =
    [input.city, input.province].filter(Boolean).join(", ") || "España";

  return `Genera contenido enriquecido para la ficha de esta empresa en un directorio.

Empresa: ${input.name}
Sector: ${input.categoryName}
Ubicación: ${location}
${input.website ? `Web: ${input.website}` : ""}
${input.existingDescription ? `Descripción previa: ${input.existingDescription}` : ""}
${input.existingServices?.length ? `Servicios conocidos: ${input.existingServices.join(", ")}` : ""}

Reglas importantes:
- Escribe en español de España, con tono profesional y natural.
- NO inventes datos concretos: nada de teléfonos, precios exactos, premios,
  años de fundación ni número de empleados. Mantén el contenido general,
  orientado al sector y a la ubicación.
- El contenido es orientativo y será revisado por un humano antes de publicarse.

Devuelve un objeto JSON con EXACTAMENTE esta estructura:
{
  "shortDescription": "una sola frase de ~140 caracteres que resuma la empresa",
  "description": "2-3 párrafos describiendo la empresa y su propuesta de valor",
  "professionalProfile": "1 párrafo de perfil profesional orientado al cliente",
  "services": [{ "name": "nombre del servicio", "description": "una frase" }],
  "faqs": [{ "question": "pregunta", "answer": "respuesta útil" }],
  "keywords": ["palabra clave SEO"],
  "metaTitle": "título SEO de ~60 caracteres",
  "metaDescription": "meta descripción SEO de ~155 caracteres"
}

Incluye entre 4 y 6 servicios típicos del sector, entre 4 y 5 preguntas
frecuentes y entre 6 y 10 keywords (combinando sector y ubicación).`;
}

/**
 * Genera contenido enriquecido para una empresa con OpenAI.
 * Funcion pura: no toca la base de datos.
 */
export async function enrichCompanyData(
  input: EnrichInput,
): Promise<Enrichment> {
  const client = getOpenAI();

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI no devolvio contenido.");
  }

  return EnrichmentSchema.parse(JSON.parse(content));
}
