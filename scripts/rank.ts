/**
 * Recalcula el ranking interno de todas las empresas publicadas y guarda
 * snapshots. Equivalente al cron GET /api/ranking.
 *   npx tsx scripts/rank.ts
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

async function main() {
  // Import dinamico: la env debe cargarse antes de instanciar Prisma.
  const { recomputeRankingScores } = await import("../src/lib/ranking-job");
  const result = await recomputeRankingScores();
  console.log(
    `  Ranking recalculado: ${result.updated} empresas en ${result.durationMs} ms`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
