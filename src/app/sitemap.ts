import type { MetadataRoute } from "next";

import { SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { MIN_ITEMS_FOR_INDEX } from "@/lib/seo/seo-pages";

// Se regenera cada hora para recoger las empresas nuevas.
export const revalidate = 3600;

/**
 * Sitemap programatico dinamico.
 * Indexa todas las empresas publicadas, categorias, provincias y las
 * landing pages /[categoria]/[ciudad] que tienen empresas.
 *
 * A escala de millones de URLs se dividiria con `generateSitemaps()`
 * (un shard por provincia); hasta 50.000 URLs un unico sitemap es suficiente.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const at = (path: string) => `${SITE.url}${path}`;
  const now = new Date();

  let categories: { slug: string; companyCount: number }[] = [];
  let provinces: { slug: string; companyCount: number }[] = [];
  let companies: {
    slug: string;
    updatedAt: Date;
    category: { slug: string };
    city: { slug: string } | null;
  }[] = [];

  try {
    [categories, provinces, companies] = await Promise.all([
      prisma.category.findMany({ select: { slug: true, companyCount: true } }),
      prisma.province.findMany({ select: { slug: true, companyCount: true } }),
      prisma.company.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          updatedAt: true,
          category: { select: { slug: true } },
          city: { select: { slug: true } },
        },
      }),
    ]);
  } catch {
    // Sin base de datos: se devuelven solo las rutas estaticas.
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: at("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: at("/categorias"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: at("/empresas"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: at("/provincias"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: at("/precios"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: at("/sobre-nosotros"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: at("/contacto"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Solo categorias/provincias con suficiente contenido: las "thin" se sirven
  // con noindex, asi que no deben aparecer en el sitemap (evita el aviso
  // "URL enviada marcada como noindex" en Search Console).
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c.companyCount >= MIN_ITEMS_FOR_INDEX)
    .map((c) => ({
      url: at(`/${c.slug}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const provinceRoutes: MetadataRoute.Sitemap = provinces
    .filter((p) => p.companyCount >= MIN_ITEMS_FOR_INDEX)
    .map((p) => ({
      url: at(`/provincias/${p.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  // Landing pages /[categoria]/[ciudad]: solo las que superan el umbral de
  // contenido (evita incluir "thin content" que luego se sirve con noindex).
  const pairCounts = new Map<string, number>();
  for (const company of companies) {
    if (!company.city) continue;
    const pair = `${company.category.slug}/${company.city.slug}`;
    pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
  }
  const landingRoutes: MetadataRoute.Sitemap = [...pairCounts.entries()]
    .filter(([, count]) => count >= MIN_ITEMS_FOR_INDEX)
    .map(([pair]) => ({
      url: at(`/${pair}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  // Una URL por empresa.
  const companyRoutes: MetadataRoute.Sitemap = companies.map((company) => ({
    url: at(`/empresa/${company.slug}`),
    lastModified: company.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...provinceRoutes,
    ...landingRoutes,
    ...companyRoutes,
  ];
}
