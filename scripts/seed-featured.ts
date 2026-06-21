/**
 * Marca como DESTACADAS (featured) varias empresas reales, una por categoría
 * popular, eligiendo en cada una la mejor valorada. Así, al entrar en la home
 * y en las páginas de categoría, algunas fichas resaltan con borde dorado y la
 * etiqueta «Recomendada».
 *
 * Es idempotente: solo toca empresas PUBLICADAS que aún no están destacadas y
 * salta la categoría de marketing (Vértigo ya está destacada). Re-ejecutable.
 *
 *   npx tsx scripts/seed-featured.ts
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

// Cuántas categorías (y por tanto empresas) destacar como máximo.
const MAX_FEATURED = 6;

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // Categorías con más empresas (las más visibles), saltando marketing.
    const categories = await prisma.category.findMany({
      where: { slug: { not: "marketing" } },
      orderBy: { companyCount: "desc" },
      take: MAX_FEATURED * 2,
      select: { id: true, slug: true, name: true },
    });

    let featuredTotal = 0;
    for (const cat of categories) {
      if (featuredTotal >= MAX_FEATURED) break;

      // Mejor empresa publicada y aún no destacada de la categoría.
      const best = await prisma.company.findFirst({
        where: {
          categoryId: cat.id,
          status: "PUBLISHED",
          featured: false,
        },
        orderBy: [{ ratingAvg: "desc" }, { reviewCount: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          ratingAvg: true,
          reviewCount: true,
        },
      });

      if (!best) {
        console.log(`  [${cat.slug}] sin candidatas, salto.`);
        continue;
      }

      await prisma.company.update({
        where: { id: best.id },
        data: { featured: true, verified: true },
      });
      featuredTotal++;
      console.log(
        `  [${cat.slug}] destacada: ${best.name} (${best.ratingAvg.toFixed(
          1,
        )}★, ${best.reviewCount} reseñas) → /empresa/${best.slug}`,
      );
    }

    const totalFeatured = await prisma.company.count({
      where: { featured: true, status: "PUBLISHED" },
    });
    console.log(
      `\n  Hecho. Nuevas destacadas: ${featuredTotal}. Total destacadas: ${totalFeatured}.`,
    );
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
