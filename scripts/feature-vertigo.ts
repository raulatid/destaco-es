/**
 * Crea/actualiza a Vertigo Marketing como empresa DESTACADA y PREMIADA:
 * primera en la home, perfil verificado, foto de Google Business y badge de
 * premiada. Obtiene la ficha real desde Google Places (foto + valoraciones) y,
 * si no la encuentra, crea la ficha con datos manuales (sin foto).
 *
 *   npx tsx scripts/feature-vertigo.ts
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

const SEARCH_QUERY = "Vértigo Marketing";
const SLUG = "vertigo-marketing";
const WEBSITE = "https://vertigomkt.com";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { searchGooglePlaces } = await import(
    "../src/lib/ingest/google-places"
  );
  const { toSlug } = await import("../src/lib/ingest/geo");
  const { AWARD_KEYWORD } = await import("../src/lib/data/companies");
  const prisma = new PrismaClient();

  try {
    const category = await prisma.category.findUnique({
      where: { slug: "marketing" },
      select: { id: true },
    });
    if (!category) throw new Error("Falta la categoria 'marketing'.");

    // 1. Intentar localizar la ficha real en Google Places (foto GMB incluida).
    let place: Awaited<ReturnType<typeof searchGooglePlaces>>[number] | null =
      null;
    if (process.env.GOOGLE_PLACES_API_KEY) {
      try {
        const results = await searchGooglePlaces(SEARCH_QUERY, 5);
        place =
          results.find((r) => norm(r.name).includes("vertigo")) ??
          results[0] ??
          null;
        console.log(
          place
            ? `  Google Places: "${place.name}" (foto: ${place.coverImage ? "si" : "no"})`
            : "  Google Places: sin resultados.",
        );
      } catch (e) {
        console.warn("  Google Places fallo, sigo con datos manuales:", e);
      }
    } else {
      console.log("  Sin GOOGLE_PLACES_API_KEY: creo ficha manual sin foto.");
    }

    // 2. Resolver ubicacion (si la ficha de Google la trae).
    let cityId: string | null = null;
    let provinceId: string | null = null;
    if (place?.provinceName) {
      const prov = await prisma.province.findUnique({
        where: { slug: toSlug(place.provinceName) },
        select: { id: true },
      });
      provinceId = prov?.id ?? null;
    }
    if (place?.cityName) {
      const city = await prisma.city.findFirst({
        where: {
          slug: toSlug(place.cityName),
          ...(provinceId ? { provinceId } : {}),
        },
        select: { id: true, provinceId: true },
      });
      if (city) {
        cityId = city.id;
        provinceId = provinceId ?? city.provinceId;
      }
    }

    const shortDescription =
      place?.shortDescription ??
      "Agencia de marketing digital y posicionamiento SEO. Estrategia, contenidos y campanas que hacen crecer tu negocio.";

    const data = {
      name: "Vértigo Marketing",
      shortDescription,
      categoryId: category.id,
      website: WEBSITE,
      phone: place?.phone ?? null,
      addressLine: place?.addressLine ?? null,
      postalCode: place?.postalCode ?? null,
      cityId,
      provinceId,
      latitude: place?.latitude ?? null,
      longitude: place?.longitude ?? null,
      coverImage: place?.coverImage ?? null,
      ratingAvg: place?.ratingAvg ?? 5,
      reviewCount: place?.reviewCount ?? 0,
      status: "PUBLISHED" as const,
      verified: true,
      featured: true,
      keywords: [AWARD_KEYWORD, "marketing", "seo", "publicidad"],
      source: place ? ("GOOGLE_PLACES" as const) : ("MANUAL" as const),
      sourceId: place?.sourceId ?? null,
      sourceUrl: place?.sourceUrl ?? WEBSITE,
      lastRefreshedAt: new Date(),
    };

    const existing = await prisma.company.findUnique({
      where: { slug: SLUG },
      select: { id: true },
    });

    if (existing) {
      await prisma.company.update({ where: { id: existing.id }, data });
      console.log("  Vertigo actualizada (destacada + premiada + verificada).");
    } else {
      await prisma.company.create({ data: { ...data, slug: SLUG } });
      console.log("  Vertigo creada (destacada + premiada + verificada).");
    }

    // Recuento de la categoria marketing.
    const companyCount = await prisma.company.count({
      where: { categoryId: category.id, status: "PUBLISHED" },
    });
    await prisma.category.update({
      where: { id: category.id },
      data: { companyCount },
    });
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
