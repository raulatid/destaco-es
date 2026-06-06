/**
 * Importacion manual desde Google Places (salta el control de cuota diario).
 * Equivalente al cron GET /api/import?force=1.
 *   npx tsx scripts/import-google.ts
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

async function main() {
  const { runDailyGoogleImport } = await import("../src/lib/ingest/google-daily");
  const result = await runDailyGoogleImport(true);
  if (!result.ran) {
    console.log(`  Importacion omitida: ${result.reason}`);
    return;
  }
  const updated = result.runs.reduce((n, r) => n + r.stats.updated, 0);
  const skipped = result.runs.reduce((n, r) => n + r.stats.skipped, 0);
  console.log(
    `  ${result.queries} consultas (${result.gaps} huecos pendientes) — ` +
      `${result.created} nuevas, ${updated} actualizadas, ${skipped} omitidas. ` +
      `IndexNow: ${result.indexed.indexNow ? "ok" : "no"}, ` +
      `sitemap: ${result.indexed.sitemap ? "ok" : "no"}.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
