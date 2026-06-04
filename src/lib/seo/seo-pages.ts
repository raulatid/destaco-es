/**
 * Sincroniza la tabla SeoPage con el estado real de la base de datos.
 *
 * Cada landing programatica /[categoria]/[ciudad], cada categoria, provincia y
 * ficha de empresa publicada se registra como SeoPage. El campo `indexable`
 * marca si la pagina supera el umbral de contenido (evita "thin content":
 * paginas casi vacias que Google penaliza). Las paginas por debajo del umbral
 * se sirven con noindex y no se incluyen en el sitemap.
 */
import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "../prisma";
import { landingTitle } from "../seo";

// Una landing categoria+ciudad necesita al menos estas empresas para indexarse.
export const MIN_ITEMS_FOR_INDEX = 3;

// Filas por INSERT masivo. 13 columnas x 500 filas = 6500 binds, holgado bajo
// el limite de 65535 parametros de PostgreSQL.
const UPSERT_CHUNK = 500;

export interface SeoSyncResult {
  upserted: number;
  indexable: number;
  noindex: number;
  durationMs: number;
}

interface PageDraft {
  path: string;
  kind: string;
  title: string;
  description?: string;
  categoryId?: string;
  cityId?: string;
  provinceId?: string;
  companyId?: string;
  itemCount: number;
  indexable: boolean;
}

export async function syncSeoPages(): Promise<SeoSyncResult> {
  const startedAt = Date.now();

  const [categories, provinces, companies] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, slug: true, name: true, companyCount: true },
    }),
    prisma.province.findMany({
      select: { id: true, slug: true, name: true, companyCount: true },
    }),
    prisma.company.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        categoryId: true,
        cityId: true,
        category: { select: { slug: true, name: true } },
        city: { select: { id: true, slug: true, name: true } },
      },
    }),
  ]);

  const drafts: PageDraft[] = [];

  for (const c of categories) {
    drafts.push({
      path: `/${c.slug}`,
      kind: "category",
      title: `Las mejores empresas de ${c.name}`,
      categoryId: c.id,
      itemCount: c.companyCount,
      indexable: c.companyCount >= MIN_ITEMS_FOR_INDEX,
    });
  }

  for (const p of provinces) {
    drafts.push({
      path: `/provincias/${p.slug}`,
      kind: "province",
      title: `Empresas en ${p.name}`,
      provinceId: p.id,
      itemCount: p.companyCount,
      indexable: p.companyCount >= MIN_ITEMS_FOR_INDEX,
    });
  }

  // Landing categoria+ciudad: contamos empresas reales por par.
  const pairs = new Map<
    string,
    { categoryId: string; cityId: string; catName: string; cityName: string; count: number }
  >();
  for (const company of companies) {
    if (!company.city) continue;
    const path = `/${company.category.slug}/${company.city.slug}`;
    const existing = pairs.get(path);
    if (existing) {
      existing.count++;
    } else {
      pairs.set(path, {
        categoryId: company.categoryId,
        cityId: company.city.id,
        catName: company.category.name,
        cityName: company.city.name,
        count: 1,
      });
    }
  }
  for (const [path, info] of pairs) {
    drafts.push({
      path,
      kind: "category_city",
      title: landingTitle(info.catName, info.cityName),
      categoryId: info.categoryId,
      cityId: info.cityId,
      itemCount: info.count,
      indexable: info.count >= MIN_ITEMS_FOR_INDEX,
    });
  }

  // Fichas de empresa: siempre indexables (contenido unico por empresa).
  for (const company of companies) {
    drafts.push({
      path: `/empresa/${company.slug}`,
      kind: "company",
      title: company.name,
      description: company.shortDescription ?? undefined,
      companyId: company.id,
      itemCount: 1,
      indexable: true,
    });
  }

  let indexable = 0;
  let noindex = 0;
  for (const d of drafts) {
    d.indexable ? indexable++ : noindex++;
  }

  // Upsert masivo por lotes: un INSERT ... ON CONFLICT (path) por chunk en vez
  // de una query por pagina. Pasa de ~90 s (>2000 fichas en serie) a unos
  // segundos, dentro del limite de 60 s del cron del plan free.
  const now = new Date();
  for (let i = 0; i < drafts.length; i += UPSERT_CHUNK) {
    const chunk = drafts.slice(i, i + UPSERT_CHUNK);
    const rows = Prisma.join(
      chunk.map(
        (d) =>
          Prisma.sql`(${randomUUID()}, ${d.path}, ${d.kind}, ${d.title}, ${d.description ?? null}, ${d.categoryId ?? null}, ${d.cityId ?? null}, ${d.provinceId ?? null}, ${d.companyId ?? null}, ${d.itemCount}, ${d.indexable}, ${now}, ${now})`,
      ),
    );
    await prisma.$executeRaw`
      INSERT INTO "SeoPage" (
        id, path, kind, title, description,
        "categoryId", "cityId", "provinceId", "companyId",
        "itemCount", indexable, "createdAt", "updatedAt"
      )
      VALUES ${rows}
      ON CONFLICT (path) DO UPDATE SET
        kind = EXCLUDED.kind,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        "categoryId" = EXCLUDED."categoryId",
        "cityId" = EXCLUDED."cityId",
        "provinceId" = EXCLUDED."provinceId",
        "companyId" = EXCLUDED."companyId",
        "itemCount" = EXCLUDED."itemCount",
        indexable = EXCLUDED.indexable,
        "updatedAt" = ${now}
    `;
  }

  return {
    upserted: drafts.length,
    indexable,
    noindex,
    durationMs: Date.now() - startedAt,
  };
}

/**
 * Devuelve un lote de paginas indexables que llevan mas tiempo sin
 * inspeccionarse, para consultar su estado en Search Console (respeta la
 * cuota: la API tiene un limite diario).
 */
export async function nextPagesToInspect(limit = 25) {
  return prisma.seoPage.findMany({
    where: { indexable: true },
    orderBy: [{ lastInspected: { sort: "asc", nulls: "first" } }],
    take: limit,
    select: { id: true, path: true },
  });
}
