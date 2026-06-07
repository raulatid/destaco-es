/**
 * Importacion diaria desde Google Places API (New) — fuente oficial y legal.
 *
 * NO se hace scraping de Google Maps ni de Paginas Amarillas (prohibido por
 * sus terminos de servicio). Se usa exclusivamente la Places API con clave de
 * servidor (vive en .env, nunca en el frontend).
 *
 * Estrategia "rellenar huecos": cada dia buscamos los pares categoria x ciudad
 * que todavia no llegan a MIN_PER_PAIR fichas publicadas y los completamos,
 * rotando a lo largo de los dias para cubrir todo el catalogo. Asi garantizamos
 * un minimo de empresas reales en cada categoria y localidad.
 *
 * Control de coste: una ejecucion al dia, con un presupuesto de consultas y un
 * tope de fichas nuevas. Cada consulta de Text Search devuelve hasta 20
 * resultados; con ~15 consultas/dia nos mantenemos MUY por debajo del nivel
 * gratuito de Google (10.000 llamadas/mes por SKU).
 */
import { CATEGORIES, SITE } from "../constants";
import { prisma } from "../prisma";
import { submitSitemap } from "../seo/search-console";
import { pingIndexNow } from "../seo/indexnow";
import { toSlug } from "./geo";
import { runIngestion, type IngestRunResult } from "./ingest-service";

/** Minimo de fichas publicadas que queremos en cada par categoria x ciudad. */
export const MIN_PER_PAIR = 3;
/**
 * Tope de fichas NUEVAS por DIA (sumando TODAS las ejecuciones del dia). El
 * cron dispara /api/import varias veces (ver vercel.json) y cada pasada sigue
 * creando hasta llegar a este tope; despues las pasadas restantes no hacen nada.
 */
const DAILY_NEW_CAP = 100;
/** Candidatos a pedir a Google por consulta (dedup deja menos como nuevos). */
const PER_QUERY_LIMIT = 16;
/**
 * Tiempo maximo (ms) que UNA ejecucion dedica a LANZAR consultas. La funcion
 * /api/import tiene maxDuration=300 s; paramos de lanzar a los 170 s para que la
 * ultima consulta (Google + IA + publicacion) termine sin que Vercel mate el
 * proceso y deje un IngestionJob a medias en estado RUNNING.
 */
const RUN_TIME_BUDGET_MS = 170_000;
/** Tope de consultas por ejecucion (protege la cuota de Google Places). */
const MAX_QUERIES_PER_RUN = 40;
/** Desplazamiento de la rotacion por dia sobre la lista de huecos. */
const DAILY_ROTATION_STRIDE = 60;
/** Antiguedad (ms) a partir de la cual un job RUNNING se considera colgado. */
const STUCK_JOB_MS = 15 * 60_000;

/**
 * Termino de busqueda por categoria. Es el nicho que la gente teclea en Google
 * ("agencias de marketing"), derivado del catalogo maestro. Incluimos TODAS las
 * categorias: aunque Google devuelva `primaryType=service` (sin tipo mapeable),
 * el respaldo por intencion de busqueda (categorySlug) las categoriza igual.
 */
const CATEGORY_QUERIES: { slug: string; noun: string }[] = CATEGORIES.map(
  (c) => ({ slug: c.slug, noun: c.noun }),
);

/** Ciudades objetivo (capitales y grandes nucleos). Amplia cobertura nacional. */
const CITIES: string[] = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Malaga",
  "Murcia", "Palma", "Bilbao", "Alicante", "Cordoba", "Valladolid",
  "Vigo", "Gijon", "Granada", "A Coruna", "Vitoria-Gasteiz", "Elche",
  "Oviedo", "Pamplona", "Almeria", "San Sebastian", "Burgos", "Albacete",
  "Santander", "Castellon", "Logrono", "Badajoz", "Salamanca", "Huelva",
  "Lleida", "Tarragona", "Leon", "Cadiz", "Jaen", "Terrassa",
];

export type DailyImportResult =
  | { ran: false; reason: string; createdToday?: number }
  | {
      ran: true;
      queries: number;
      gaps: number;
      /** Fichas creadas en ESTA ejecucion. */
      created: number;
      /** Fichas creadas HOY sumando todas las ejecuciones (incluida esta). */
      createdToday: number;
      /** Por que paro la ejecucion: tope diario, presupuesto de tiempo o sin huecos. */
      stop: "daily-cap" | "time-budget" | "query-cap" | "no-gaps";
      runs: IngestRunResult[];
      indexed: { indexNow: boolean; sitemap: boolean };
    };

/**
 * Calcula los pares categoria x ciudad que aun no llegan a MIN_PER_PAIR
 * fichas publicadas. Devuelve las consultas de busqueda correspondientes,
 * en orden determinista (para rotar por dias).
 */
async function findGaps(): Promise<{ query: string; slug: string }[]> {
  const [categories, cities, grouped] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.city.findMany({ select: { id: true, slug: true } }),
    prisma.company.groupBy({
      by: ["categoryId", "cityId"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    }),
  ]);

  const catIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const cityIdBySlug = new Map(cities.map((c) => [c.slug, c.id]));
  const countByPair = new Map<string, number>();
  for (const g of grouped) {
    if (g.categoryId && g.cityId) {
      countByPair.set(`${g.categoryId}:${g.cityId}`, g._count._all);
    }
  }

  const gaps: { query: string; slug: string }[] = [];
  for (const city of CITIES) {
    const cityId = cityIdBySlug.get(toSlug(city));
    for (const cat of CATEGORY_QUERIES) {
      const catId = catIdBySlug.get(cat.slug);
      const count =
        catId && cityId ? (countByPair.get(`${catId}:${cityId}`) ?? 0) : 0;
      if (count < MIN_PER_PAIR) {
        gaps.push({ query: `${cat.noun} en ${city}`, slug: cat.slug });
      }
    }
  }
  return gaps;
}

/** Medianoche de hoy (hora del servidor; en Vercel es UTC). */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Marca como FAILED los jobs de import que llevan demasiado tiempo en RUNNING:
 * son ejecuciones que Vercel corto al alcanzar el limite de la funcion. Asi el
 * panel queda limpio y no se quedan "colgados" indefinidamente.
 */
async function cleanupStuckJobs(): Promise<void> {
  try {
    await prisma.ingestionJob.updateMany({
      where: {
        type: "INGEST",
        source: "GOOGLE_PLACES",
        status: "RUNNING",
        createdAt: { lt: new Date(Date.now() - STUCK_JOB_MS) },
      },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: "Interrumpido (limite de tiempo de la funcion)",
      },
    });
  } catch (error) {
    console.error("[import] no se pudieron limpiar jobs colgados:", error);
  }
}

/** Fichas de Google creadas hoy (suma de todas las ejecuciones del dia). */
function countCreatedToday(): Promise<number> {
  return prisma.company.count({
    where: { source: "GOOGLE_PLACES", createdAt: { gte: startOfToday() } },
  });
}

/** Consultas ya intentadas hoy (para que varias pasadas no repitan trabajo). */
async function queriesAttemptedToday(): Promise<Set<string>> {
  const jobs = await prisma.ingestionJob.findMany({
    where: {
      type: "INGEST",
      source: "GOOGLE_PLACES",
      createdAt: { gte: startOfToday() },
    },
    select: { query: true },
  });
  return new Set(jobs.map((j) => j.query).filter((q): q is string => !!q));
}

/**
 * Importacion diaria desde Google Places. Pensada para dispararse VARIAS veces
 * al dia (Vercel Cron): cada pasada esta acotada en tiempo y va sumando fichas
 * hasta alcanzar DAILY_NEW_CAP en total; despues las pasadas restantes son
 * no-ops. Esto evita depender de una sola funcion de 300 s para crear 100
 * fichas (lo que solo permitia ~25/dia) y elimina los jobs colgados.
 *
 * Pasa `force: true` para saltarte el tope diario (uso manual desde admin).
 */
export async function runDailyGoogleImport(
  force = false,
): Promise<DailyImportResult> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { ran: false, reason: "Falta GOOGLE_PLACES_API_KEY" };
  }

  await cleanupStuckJobs();

  const createdBefore = await countCreatedToday();
  if (!force && createdBefore >= DAILY_NEW_CAP) {
    return {
      ran: false,
      reason: "Tope diario ya alcanzado",
      createdToday: createdBefore,
    };
  }

  const gaps = await findGaps();
  if (gaps.length === 0) {
    return { ran: false, reason: "No hay huecos que rellenar", createdToday: createdBefore };
  }

  // Rotacion por dias: cada dia empezamos en un tramo distinto de la lista de
  // huecos para cubrir todo el catalogo con el tiempo (y no atascarnos en pares
  // que Google nunca llega a llenar). Dentro del mismo dia, descartamos las
  // consultas ya intentadas para que las distintas pasadas avancen sin repetir.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const offset = (dayIndex * DAILY_ROTATION_STRIDE) % gaps.length;
  const rotated = [...gaps.slice(offset), ...gaps.slice(0, offset)];
  const attempted = await queriesAttemptedToday();
  const queue = rotated.filter((g) => !attempted.has(g.query));

  const runs: IngestRunResult[] = [];
  const createdSlugs: string[] = [];
  const runStart = Date.now();
  let created = 0;
  let queries = 0;
  let stop: "daily-cap" | "time-budget" | "query-cap" | "no-gaps" = "no-gaps";

  for (const { query, slug } of queue) {
    if (createdBefore + created >= DAILY_NEW_CAP) {
      stop = "daily-cap";
      break;
    }
    if (Date.now() - runStart > RUN_TIME_BUDGET_MS) {
      stop = "time-budget";
      break;
    }
    if (queries >= MAX_QUERIES_PER_RUN) {
      stop = "query-cap";
      break;
    }

    const result = await runIngestion(
      { source: "GOOGLE_PLACES", query, limit: PER_QUERY_LIMIT, categorySlug: slug },
      // Publicacion automatica: enriquecer con IA y publicar el mismo dia.
      { autoEnrich: true, autoPublish: true },
    );
    runs.push(result);
    queries++;
    created += result.stats.created;
    createdSlugs.push(...result.createdSlugs);
  }

  // Auto-indexacion de las fichas nuevas (best-effort, no bloquea):
  //  - IndexNow: aviso instantaneo a Bing/Yandex/etc. (gratis).
  //  - Sitemap a Google Search Console (si hay credenciales de servicio).
  let indexNow = false;
  let sitemap = false;
  if (createdSlugs.length > 0) {
    const urls = createdSlugs.map((slug) => `${SITE.url}/empresa/${slug}`);
    indexNow = await pingIndexNow([SITE.url, ...urls]).catch(() => false);
    sitemap = (await submitSitemap().catch(() => ({ ok: false }))).ok;
  }

  return {
    ran: true,
    queries,
    gaps: gaps.length,
    created,
    createdToday: createdBefore + created,
    stop,
    runs,
    indexed: { indexNow, sitemap },
  };
}
