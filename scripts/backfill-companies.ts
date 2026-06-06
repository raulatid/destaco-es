/**
 * Backfill de empresas reales (Google Places API — fuente oficial).
 *
 * Rellena los pares categoria x ciudad que estan por debajo de TARGET_PER_PAIR
 * fichas publicadas, recorriendo TODO el catalogo (no solo las 9 categorias que
 * se importaron al principio). Asi las landings /[categoria]/[ciudad] dejan de
 * salir vacias (p. ej. /marketing/madrid).
 *
 *   npx tsx scripts/backfill-companies.ts
 *
 * Variables de entorno opcionales:
 *   TARGET_PER_PAIR  fichas objetivo por par (def. 4)
 *   MAX_NEW          tope de fichas NUEVAS en toda la ejecucion (def. 800)
 *   PER_QUERY        candidatos pedidos a Google por consulta (def. 14)
 *   ENRICH           "0" para NO enriquecer con IA (mas barato/rapido); def. "1"
 *   ONLY_EMPTY       "1" para atacar solo categorias hoy vacias (def. "0")
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

const TARGET_PER_PAIR = Number(process.env.TARGET_PER_PAIR ?? 4);
const MAX_NEW = Number(process.env.MAX_NEW ?? 800);
const PER_QUERY = Number(process.env.PER_QUERY ?? 14);
const ENRICH = process.env.ENRICH !== "0";
const ONLY_EMPTY = process.env.ONLY_EMPTY === "1";
// "1" para atacar SOLO subcategorias (las que tienen `parent`), de modo que
// cada nicho (agencias-seo, abogados-laboralistas...) se rellene con su propia
// busqueda en lugar de gastar el presupuesto en las categorias madre.
const SUBCATS_ONLY = process.env.SUBCATS_ONLY === "1";

// Ciudades objetivo: capitales y grandes nucleos (cobertura nacional amplia).
const ALL_CITIES: string[] = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Malaga",
  "Murcia", "Palma", "Bilbao", "Alicante", "Cordoba", "Valladolid",
  "Vigo", "Gijon", "Granada", "A Coruna", "Vitoria", "Pamplona",
  "Oviedo", "Santander", "Salamanca", "Tarragona",
];
// CITY_LIMIT recorta cuantas ciudades se usan por categoria: util para repartir
// el presupuesto "a lo ancho" entre muchas subcategorias (def. todas).
const CITY_LIMIT = Number(process.env.CITY_LIMIT ?? ALL_CITIES.length);
const CITIES = ALL_CITIES.slice(0, Math.max(1, CITY_LIMIT));

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { CATEGORIES } = await import("../src/lib/constants");
  const { toSlug } = await import("../src/lib/ingest/geo");
  const { runIngestion } = await import("../src/lib/ingest/ingest-service");
  const prisma = new PrismaClient();

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error("Falta GOOGLE_PLACES_API_KEY en .env. Abortando.");
    process.exit(1);
  }

  try {
    // Todas las categorias del catalogo: el respaldo por intencion de busqueda
    // (categorySlug) ya categoriza las que Google devuelve como "service".
    const queries = SUBCATS_ONLY
      ? CATEGORIES.filter((c) => c.parent)
      : CATEGORIES;

    // Conteo actual por par categoria x ciudad.
    const [cats, cities, grouped] = await Promise.all([
      prisma.category.findMany({ select: { id: true, slug: true } }),
      prisma.city.findMany({ select: { id: true, slug: true } }),
      prisma.company.groupBy({
        by: ["categoryId", "cityId"],
        where: { status: "PUBLISHED" },
        _count: { _all: true },
      }),
    ]);
    const catIdBySlug = new Map(cats.map((c) => [c.slug, c.id]));
    const cityIdBySlug = new Map(cities.map((c) => [c.slug, c.id]));
    const countByPair = new Map<string, number>();
    for (const g of grouped) {
      if (g.categoryId && g.cityId) {
        countByPair.set(`${g.categoryId}:${g.cityId}`, g._count._all);
      }
    }
    const catTotal = new Map<string, number>();
    for (const g of grouped) {
      if (g.categoryId) {
        catTotal.set(
          g.categoryId,
          (catTotal.get(g.categoryId) ?? 0) + g._count._all,
        );
      }
    }

    // Construye la lista de huecos (categoria primero: rellena categorias
    // enteras antes de pasar a la siguiente).
    const gaps: { query: string; cat: string; city: string }[] = [];
    for (const cat of queries) {
      const catId = catIdBySlug.get(cat.slug);
      if (ONLY_EMPTY && catId && (catTotal.get(catId) ?? 0) > 0) continue;
      for (const city of CITIES) {
        const cityId = cityIdBySlug.get(toSlug(city));
        const count =
          catId && cityId ? (countByPair.get(`${catId}:${cityId}`) ?? 0) : 0;
        if (count < TARGET_PER_PAIR) {
          gaps.push({ query: `${cat.noun} en ${city}`, cat: cat.slug, city });
        }
      }
    }

    console.log(
      `Huecos a rellenar: ${gaps.length} | objetivo/par: ${TARGET_PER_PAIR} | ` +
        `tope nuevas: ${MAX_NEW} | enrich: ${ENRICH ? "si" : "no"}`,
    );

    let created = 0;
    let done = 0;
    for (const gap of gaps) {
      if (created >= MAX_NEW) {
        console.log(`Alcanzado el tope de ${MAX_NEW} fichas nuevas. Paro.`);
        break;
      }
      try {
        const res = await runIngestion(
          {
            source: "GOOGLE_PLACES",
            query: gap.query,
            limit: PER_QUERY,
            categorySlug: gap.cat,
          },
          { autoEnrich: ENRICH, autoPublish: true },
        );
        created += res.stats.created;
        done++;
        console.log(
          `[${done}/${gaps.length}] "${gap.query}" → +${res.stats.created} ` +
            `nuevas (encontradas ${res.stats.found}, total nuevas ${created})`,
        );
      } catch (e) {
        console.warn(`  Fallo en "${gap.query}":`, e instanceof Error ? e.message : e);
      }
    }

    console.log(`\nListo. Fichas nuevas creadas: ${created}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
