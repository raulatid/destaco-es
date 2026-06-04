/**
 * Sincroniza la tabla SeoPage con el estado real de la BD y, si hay
 * credenciales de Search Console, reenvia el sitemap.
 * Equivalente al cron GET /api/seo.
 *   npx tsx scripts/seo-sync.ts
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

async function main() {
  const { syncSeoPages } = await import("../src/lib/seo/seo-pages");
  const { searchConsoleEnabled, submitSitemap } = await import(
    "../src/lib/seo/search-console"
  );

  const sync = await syncSeoPages();
  console.log(
    `  SeoPage sincronizado: ${sync.upserted} paginas (${sync.indexable} indexables, ${sync.noindex} noindex) en ${sync.durationMs} ms`,
  );

  if (searchConsoleEnabled()) {
    const result = await submitSitemap();
    console.log(
      result.ok
        ? "  Sitemap enviado a Search Console."
        : `  No se pudo enviar el sitemap: ${result.error ?? "credenciales ausentes"}`,
    );
  } else {
    console.log("  Search Console desactivado (faltan credenciales).");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
