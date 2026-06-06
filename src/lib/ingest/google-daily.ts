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
/** Consultas (pares con hueco) que atacamos por ejecucion diaria. */
const DAILY_QUERY_BUDGET = 40;
/** Tope de fichas NUEVAS por ejecucion (controla coste de IA y tiempo). */
const DAILY_NEW_CAP = 100;
/** Candidatos a pedir a Google por consulta (dedup deja menos como nuevos). */
const PER_QUERY_LIMIT = 16;

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
  "Vigo", "Gijon", "Granada", "A Coruna", "Vitoria", "Elche",
  "Oviedo", "Pamplona", "Almeria", "San Sebastian", "Burgos", "Albacete",
  "Santander", "Castellon", "Logrono", "Badajoz", "Salamanca", "Huelva",
  "Lleida", "Tarragona", "Leon", "Cadiz", "Jaen", "Tarrasa",
];

export type DailyImportResult =
  | { ran: false; reason: string }
  | {
      ran: true;
      queries: number;
      gaps: number;
      created: number;
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

  const gaps = await findGaps();

  // Rotacion por dias: cada dia atacamos un tramo distinto de la lista de
  // huecos, de forma que con el tiempo se cubren todos.
  const selected: { query: string; slug: string }[] = [];
  if (gaps.length > 0) {
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const start = (dayIndex * DAILY_QUERY_BUDGET) % gaps.length;
    for (let i = 0; i < Math.min(DAILY_QUERY_BUDGET, gaps.length); i++) {
      selected.push(gaps[(start + i) % gaps.length]);
    }
  }

  const runs: IngestRunResult[] = [];
  const createdSlugs: string[] = [];
  let created = 0;

  for (const { query, slug } of selected) {
    if (created >= DAILY_NEW_CAP) break;
    const result = await runIngestion(
      {
        source: "GOOGLE_PLACES",
        query,
        limit: PER_QUERY_LIMIT,
        categorySlug: slug,
      },
      // Publicacion automatica: enriquecer con IA y publicar el mismo dia.
      { autoEnrich: true, autoPublish: true },
    );
    runs.push(result);
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
    queries: selected.length,
    gaps: gaps.length,
    created,
    runs,
    indexed: { indexNow, sitemap },
  };
}
