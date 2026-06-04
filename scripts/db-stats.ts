/**
 * Muestra un resumen rapido del estado de la base de datos.
 *   npx tsx scripts/db-stats.ts
 */
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

const prisma = new PrismaClient();

async function main() {
  const [total, draft, pending, published, provinces, categories, cities] =
    await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "DRAFT" } }),
      prisma.company.count({ where: { status: "PENDING" } }),
      prisma.company.count({ where: { status: "PUBLISHED" } }),
      prisma.province.count(),
      prisma.category.count(),
      prisma.city.count(),
    ]);

  console.log(`\n  Provincias: ${provinces} · Ciudades: ${cities} · Categorias: ${categories}`);
  console.log(
    `  Empresas: ${total}  (DRAFT ${draft} · PENDING ${pending} · PUBLISHED ${published})\n`,
  );

  const sample = await prisma.company.findMany({
    take: 12,
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      status: true,
      category: { select: { name: true } },
      city: { select: { name: true } },
    },
  });
  for (const c of sample) {
    console.log(
      `  - ${c.name}  [${c.status}]  ${c.category.name} / ${c.city?.name ?? "?"}`,
    );
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
