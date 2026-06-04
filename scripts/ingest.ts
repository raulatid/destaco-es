/**
 * CLI de ingesta de empresas.
 *
 *   # Probar sin tocar la base de datos (recomendado la primera vez):
 *   npx tsx scripts/ingest.ts --source=osm --area=Valencia --category=restaurantes --dry-run
 *   npx tsx scripts/ingest.ts --source=google --query="dentistas en Valencia" --dry-run
 *
 *   # Ingesta real (requiere PostgreSQL en marcha):
 *   npx tsx scripts/ingest.ts --source=osm --area=Madrid --category=abogados
 *   npx tsx scripts/ingest.ts --source=google --query="marketing en Madrid"
 */
import { searchGooglePlaces } from "../src/lib/ingest/google-places";
import { searchOpenStreetMap } from "../src/lib/ingest/openstreetmap";
import { runIngestion } from "../src/lib/ingest/ingest-service";
import type { NormalizedCompany } from "../src/lib/ingest/types";

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env: se usaran las variables del entorno */
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}
const has = (name: string) => process.argv.includes(`--${name}`);

function printPreview(companies: NormalizedCompany[]) {
  console.log(`\n  ${companies.length} empresas encontradas:\n`);
  for (const c of companies.slice(0, 30)) {
    const cat = c.categorySlug ?? "(sin categoria)";
    const place = [c.cityName, c.provinceName].filter(Boolean).join(", ");
    const rating = c.ratingAvg ? ` · ${c.ratingAvg}★` : "";
    const contact = [c.website && "web", c.phone && "tel"]
      .filter(Boolean)
      .join("/");
    console.log(`  • ${c.name}`);
    console.log(
      `    ${cat} · ${place || "ubicacion desconocida"}${rating}${contact ? ` · ${contact}` : ""}`,
    );
  }
  if (companies.length > 30) console.log(`  … y ${companies.length - 30} mas`);
}

async function main() {
  const source = (arg("source") ?? "osm").toLowerCase();
  const limit = Number(arg("limit") ?? (source === "google" ? 40 : 60));
  const dryRun = has("dry-run");

  console.log(`\n  Destaco.es — ingesta (${source}${dryRun ? " · dry-run" : ""})`);

  if (source === "google") {
    const query = arg("query");
    if (!query) throw new Error("Falta --query para la fuente google.");
    if (dryRun) {
      printPreview(await searchGooglePlaces(query, limit));
    } else {
      const result = await runIngestion({
        source: "GOOGLE_PLACES",
        query,
        limit,
      });
      console.log("\n  Resultado:", JSON.stringify(result.stats, null, 2));
    }
  } else if (source === "osm") {
    const area = arg("area");
    const category = arg("category");
    if (!area || !category) {
      throw new Error("Faltan --area y --category para la fuente osm.");
    }
    if (dryRun) {
      printPreview(await searchOpenStreetMap(area, category, limit));
    } else {
      const result = await runIngestion({
        source: "OPENSTREETMAP",
        area,
        category,
        limit,
      });
      console.log("\n  Resultado:", JSON.stringify(result.stats, null, 2));
    }
  } else {
    throw new Error(`Fuente desconocida: ${source} (usa google u osm).`);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n  Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
