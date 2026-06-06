/**
 * Genera con IA la descripcion SEO (y meta titulo, meta descripcion, perfil,
 * keywords, servicios y FAQs) de las empresas YA PUBLICADAS que aun no tienen
 * `descriptionAI`. A diferencia del flujo de ingesta, NO cambia el estado: las
 * fichas siguen PUBLISHED durante todo el proceso (asi no desaparecen del
 * directorio mientras se enriquecen).
 *
 * Objetivo: que cada perfil tenga contenido unico y optimizado para que Google
 * lo indexe y posicione.
 *
 *   npx tsx scripts/enrich-published.ts
 *
 * Variables de entorno:
 *   LIMIT=500        -> maximo de fichas a procesar en esta ejecucion (def: todas)
 *   CONCURRENCY=6    -> peticiones a OpenAI en paralelo (def: 6)
 *   CATEGORY=agencias-seo -> limitar a una categoria (slug; opcional)
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

const LIMIT = Number(process.env.LIMIT) || undefined;
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY) || 4);
const CATEGORY = process.env.CATEGORY?.trim() || undefined;

async function pool<T>(
  items: T[],
  size: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const i = cursor++;
        await fn(items[i], i);
      }
    })(),
  );
  await Promise.all(workers);
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { enrichCompanyData } = await import("../src/lib/ai/enrich");
  const { AWARD_KEYWORD } = await import("../src/lib/data/companies");
  const prisma = new PrismaClient();

  try {
    const companies = await prisma.company.findMany({
      where: {
        status: "PUBLISHED",
        descriptionAI: null,
        ...(CATEGORY && {
          category: {
            OR: [{ slug: CATEGORY }, { parent: { slug: CATEGORY } }],
          },
        }),
      },
      include: { category: true, city: true, province: true, services: true },
      orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }, { createdAt: "asc" }],
      ...(LIMIT ? { take: LIMIT } : {}),
    });

    console.log(
      `  Fichas a enriquecer: ${companies.length}` +
        (CATEGORY ? ` (categoria: ${CATEGORY})` : "") +
        ` · concurrencia ${CONCURRENCY}`,
    );

    let done = 0;
    let errors = 0;

    await pool(companies, CONCURRENCY, async (company) => {
      try {
        const e = await enrichCompanyData({
          name: company.name,
          categoryName: company.category.name,
          city: company.city?.name,
          province: company.province?.name,
          website: company.website,
          existingDescription: company.description,
          existingServices: company.services.map((s) => s.name),
        });

        // Conservamos la marca de empresa premiada si la tenia.
        const keywords = company.keywords.includes(AWARD_KEYWORD)
          ? [AWARD_KEYWORD, ...e.keywords.filter((k) => k !== AWARD_KEYWORD)]
          : e.keywords;

        // Escrituras NO transaccionales: bajo concurrencia, abrir una
        // transaccion interactiva en el pooler de Supabase agota el tiempo de
        // espera. La atomicidad no es critica para contenido de marketing.
        await prisma.company.update({
          where: { id: company.id },
          data: {
            shortDescription: company.shortDescription ?? e.shortDescription,
            descriptionAI: e.description,
            professionalProfile: e.professionalProfile,
            // No pisamos un meta ya escrito (p. ej. Vertigo); rellenamos huecos.
            metaTitle: company.metaTitle ?? e.metaTitle,
            metaDescription: company.metaDescription ?? e.metaDescription,
            keywords,
            lastEnrichedAt: new Date(),
            // El estado NO cambia: sigue PUBLISHED.
          },
        });

        if (company.services.length === 0) {
          await prisma.service.createMany({
            data: e.services.map((s, i) => ({
              companyId: company.id,
              name: s.name,
              description: s.description,
              order: i,
            })),
          });
        }

        const faqCount = await prisma.faq.count({
          where: { companyId: company.id },
        });
        if (faqCount === 0) {
          await prisma.faq.createMany({
            data: e.faqs.map((f, i) => ({
              companyId: company.id,
              question: f.question,
              answer: f.answer,
              generatedByAI: true,
              order: i,
            })),
          });
        }

        done++;
        if (done % 25 === 0 || done === companies.length) {
          console.log(`  [${done}/${companies.length}] enriquecidas`);
        }
      } catch (error) {
        errors++;
        console.error(
          `  Error en "${company.name}" (${company.slug}):`,
          error instanceof Error ? error.message : error,
        );
      }
    });

    console.log(`\n  Hecho. Enriquecidas: ${done} · errores: ${errors}`);
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
