/**
 * Publica todas las empresas ingeridas y recalcula los recuentos.
 * Util para la carga inicial de datos reales.
 *   npx tsx scripts/publish-all.ts
 */
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

const prisma = new PrismaClient();

async function main() {
  const published = await prisma.company.updateMany({
    where: { status: { in: ["DRAFT", "PENDING"] } },
    data: { status: "PUBLISHED" },
  });
  console.log(`  Publicadas: ${published.count} empresas`);

  // Las enriquecidas con IA pasan a destacadas (perfil completo).
  const featured = await prisma.company.updateMany({
    where: { descriptionAI: { not: null } },
    data: { featured: true },
  });
  console.log(`  Destacadas (enriquecidas con IA): ${featured.count}`);

  for (const c of await prisma.category.findMany({ select: { id: true } })) {
    const companyCount = await prisma.company.count({
      where: { categoryId: c.id, status: "PUBLISHED" },
    });
    await prisma.category.update({
      where: { id: c.id },
      data: { companyCount },
    });
  }
  for (const p of await prisma.province.findMany({ select: { id: true } })) {
    const companyCount = await prisma.company.count({
      where: { provinceId: p.id, status: "PUBLISHED" },
    });
    await prisma.province.update({
      where: { id: p.id },
      data: { companyCount },
    });
  }
  for (const c of await prisma.city.findMany({ select: { id: true } })) {
    const companyCount = await prisma.company.count({
      where: { cityId: c.id, status: "PUBLISHED" },
    });
    await prisma.city.update({ where: { id: c.id }, data: { companyCount } });
  }
  console.log("  Recuentos por categoria, provincia y ciudad actualizados.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
