/**
 * Ingesta masiva de empresas reales con Google Places API.
 * Recorre una matriz de ciudades x categorias.
 *
 *   npx tsx scripts/ingest-batch.ts
 *
 * Coste aproximado: ~3 llamadas por combinacion (~0,03 EUR cada una).
 */
import { runIngestion } from "../src/lib/ingest/ingest-service";

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

const CITIES = [
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
  "Zaragoza",
  "Malaga",
  "Murcia",
  "Bilbao",
  "Alicante",
  "Cordoba",
  "Valladolid",
  "Vigo",
  "Granada",
  "Gijon",
  "A Coruna",
];

const TERMS = [
  "restaurantes",
  "abogados",
  "dentistas",
  "peluquerias",
  "gimnasios",
  "inmobiliarias",
  "talleres mecanicos",
  "agencias de marketing",
  "fotografos",
  "empresas de reformas",
  "academias de formacion",
  "empresas de informatica",
];

async function main() {
  const totals = { found: 0, created: 0, updated: 0, skipped: 0, errors: 0 };
  const totalCombos = CITIES.length * 3;
  let n = 0;

  for (let i = 0; i < CITIES.length; i++) {
    for (let t = 0; t < 3; t++) {
      const term = TERMS[(i * 3 + t) % TERMS.length];
      const query = `${term} en ${CITIES[i]}`;
      n++;
      try {
        const { stats } = await runIngestion({
          source: "GOOGLE_PLACES",
          query,
          limit: 60,
        });
        totals.found += stats.found;
        totals.created += stats.created;
        totals.updated += stats.updated;
        totals.skipped += stats.skipped;
        totals.errors += stats.errors;
        console.log(
          `[${n}/${totalCombos}] ${query} — creadas ${stats.created}, actualizadas ${stats.updated}, omitidas ${stats.skipped}`,
        );
      } catch (error) {
        console.error(
          `[${n}/${totalCombos}] ${query} — ERROR: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  console.log(
    `\nTOTAL — encontradas ${totals.found}, creadas ${totals.created}, actualizadas ${totals.updated}, omitidas ${totals.skipped}, errores ${totals.errors}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
