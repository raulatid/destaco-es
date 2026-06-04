/**
 * CLI de enriquecimiento con IA.
 *
 *   # Probar contra OpenAI sin tocar la base de datos:
 *   npx tsx scripts/enrich.ts --dry-run
 *   npx tsx scripts/enrich.ts --dry-run --name="Bar Pepe" --category="Restaurantes" --city="Sevilla"
 *
 *   # Enriquecimiento real de empresas DRAFT (requiere PostgreSQL):
 *   npx tsx scripts/enrich.ts --limit=20
 */
import { enrichCompanyData } from "../src/lib/ai/enrich";
import { runEnrichment } from "../src/lib/ai/enrich-service";

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env: se usan las variables del entorno */
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  console.log("\n  Destaco.es — enriquecimiento con IA\n");

  if (has("dry-run")) {
    const name = arg("name") ?? "Clinica Dental Sonrisa";
    const category = arg("category") ?? "Clinicas Dentales";
    const city = arg("city") ?? "Valencia";

    console.log(`  Generando contenido para: ${name} (${category}, ${city})\n`);
    const result = await enrichCompanyData({
      name,
      categoryName: category,
      city,
    });
    console.log(JSON.stringify(result, null, 2));
  } else {
    const limit = Number(arg("limit") ?? 10);
    const result = await runEnrichment({ limit });
    console.log("  Resultado:", JSON.stringify(result.stats, null, 2));
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n  Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
