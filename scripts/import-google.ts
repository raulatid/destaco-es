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
  console.log(
    `  "${result.query}" — ${result.stats.created} nuevas, ${result.stats.updated} actualizadas, ${result.stats.skipped} omitidas.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
