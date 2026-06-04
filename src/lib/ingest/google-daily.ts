/**
 * Importacion diaria desde Google Places API (New) — fuente oficial y legal.
 *
 * NO se hace scraping de Google Maps ni de Paginas Amarillas (prohibido por
 * sus terminos de servicio). Se usa exclusivamente la Places API con clave de
 * servidor (vive en .env, nunca en el frontend).
 *
 * Control de cuota: solo se ejecuta una importacion al dia y se trae un lote
 * pequeno (20 fichas), para mantener bajo el coste de la API y evitar duplicar
 * trabajo si el cron se dispara mas de una vez.
 */
import { prisma } from "../prisma";
import { runIngestion, type IngestRunResult } from "./ingest-service";

export const DAILY_IMPORT_LIMIT = 20;

/** Consultas rotativas (nicho + ciudad). Una por dia. */
const QUERIES: string[] = [
  "agencias de marketing en Madrid",
  "abogados en Barcelona",
  "dentistas en Valencia",
  "reformas integrales en Sevilla",
  "centros de estetica en Malaga",
  "gimnasios en Zaragoza",
  "asesorias fiscales en Bilbao",
  "inmobiliarias en Alicante",
  "fontaneros en Murcia",
  "fotografos de boda en Granada",
  "talleres mecanicos en Valladolid",
  "clinicas veterinarias en Vigo",
  "academias de ingles en Cordoba",
  "electricistas en Gijon",
];

export type DailyImportResult =
  | { ran: false; reason: string }
  | ({ ran: true } & IngestRunResult);

/**
 * Ejecuta la importacion diaria si no se ha hecho ya hoy (control de cuota).
 * Pasa `force: true` para saltarte la comprobacion (uso manual desde admin).
 */
export async function runDailyGoogleImport(
  force = false,
): Promise<DailyImportResult> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { ran: false, reason: "Falta GOOGLE_PLACES_API_KEY" };
  }

  if (!force) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const alreadyRan = await prisma.ingestionJob.count({
      where: {
        source: "GOOGLE_PLACES",
        type: "INGEST",
        createdAt: { gte: startOfDay },
        status: { in: ["RUNNING", "COMPLETED"] },
      },
    });
    if (alreadyRan > 0) {
      return { ran: false, reason: "Ya se ejecuto hoy (cuota diaria)" };
    }
  }

  const dayIndex = Math.floor(Date.now() / 86_400_000) % QUERIES.length;
  const query = QUERIES[dayIndex];

  const result = await runIngestion(
    { source: "GOOGLE_PLACES", query, limit: DAILY_IMPORT_LIMIT },
    // Publicacion automatica: las fichas nuevas se enriquecen y se publican el
    // mismo dia, sin pasar por revision manual.
    { autoEnrich: true, autoPublish: true },
  );

  return { ran: true, ...result };
}
