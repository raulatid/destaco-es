/**
 * Sincroniza SOLO el catalogo de categorias (constants.ts -> tabla Category).
 * Idempotente y seguro para produccion: NO toca usuarios ni empresas, solo
 * hace upsert de las categorias y recalcula su companyCount.
 *
 * Usar tras ampliar/segmentar el catalogo maestro:
 *   npx tsx scripts/seed-categories.ts
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { CATEGORIES, bestNoun } = await import("../src/lib/constants");
  const prisma = new PrismaClient();

  try {
    // 1a pasada: upsert de todas las categorias (sin relacion madre todavia).
    for (const [i, cat] of CATEGORIES.entries()) {
      const meta = {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        order: i,
        featured: cat.featured,
        metaTitle: `${bestNoun(cat.noun)} en España`,
        metaDescription: `Directorio de ${bestNoun(cat.noun, true)} en España. ${cat.description}`,
      };
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: meta,
        create: { slug: cat.slug, ...meta },
      });
    }
    console.log(`  ${CATEGORIES.length} categorias sincronizadas.`);

    // 2a pasada: enlazar cada subcategoria con su madre (parentId). Las de
    // primer nivel quedan con parentId = null.
    const idBySlug = new Map(
      (
        await prisma.category.findMany({ select: { id: true, slug: true } })
      ).map((c) => [c.slug, c.id]),
    );
    let linked = 0;
    for (const cat of CATEGORIES) {
      const parentId = cat.parent ? (idBySlug.get(cat.parent) ?? null) : null;
      await prisma.category.update({
        where: { slug: cat.slug },
        data: { parentId },
      });
      if (parentId) linked++;
    }
    console.log(`  ${linked} subcategorias enlazadas con su madre.`);

    // Recuento de empresas publicadas por categoria.
    let recounted = 0;
    for (const cat of await prisma.category.findMany({
      select: { id: true },
    })) {
      const companyCount = await prisma.company.count({
        where: { categoryId: cat.id, status: "PUBLISHED" },
      });
      await prisma.category.update({
        where: { id: cat.id },
        data: { companyCount },
      });
      recounted++;
    }
    console.log(`  companyCount recalculado en ${recounted} categorias.`);
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
