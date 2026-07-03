/**
 * Orquestador de ingesta: descarga de la fuente, normaliza, deduplica,
 * resuelve geografia y persiste en PostgreSQL registrando un IngestionJob.
 *
 * Las empresas se crean en estado DRAFT — la etapa de enriquecimiento con IA
 * (ENRICH) y la aprobacion del admin las pasan a PUBLISHED.
 */
import { Prisma } from "@prisma/client";

import { enrichCompany } from "../ai/enrich-service";
import { prisma } from "../prisma";
import { toSlug } from "./geo";
import { searchGooglePlaces } from "./google-places";
import { searchOpenStreetMap } from "./openstreetmap";
import type { IngestStats, NormalizedCompany } from "./types";

export type IngestParams =
  | {
      source: "GOOGLE_PLACES";
      query: string;
      limit?: number;
      /**
       * Categoria de la BUSQUEDA (intencion). La Places API (New) devuelve
       * `primaryType=service` para muchos negocios de servicios (marketing,
       * asesorias, etc.), sin un tipo mapeable. Como la consulta ya es de
       * intencion ("agencias de marketing en Madrid"), usamos este slug como
       * respaldo cuando el tipo de Google no permite categorizar.
       */
      categorySlug?: string;
    }
  | { source: "OPENSTREETMAP"; area: string; category: string; limit?: number };

export interface IngestOptions {
  /** Enriquecer con IA cada ficha nueva (best-effort) antes de publicar. */
  autoEnrich?: boolean;
  /** Publicar las fichas nuevas al terminar (las hace visibles en el directorio). */
  autoPublish?: boolean;
}

/**
 * Fichas que se enriquecen con IA a la vez. Mas concurrencia = menos lotes y
 * menos tiempo total por consulta (clave para que el import diario alcance el
 * tope dentro del limite de la funcion). Configurable por entorno; 12 equilibra
 * velocidad con el rate limit de OpenAI y el pool de conexiones de Postgres.
 */
const ENRICH_CONCURRENCY = Math.max(
  1,
  Number(process.env.ENRICH_CONCURRENCY) || 16,
);

/** Tope duro por ficha: si el enriquecimiento se atasca, no bloquea el lote. */
const ENRICH_TIMEOUT_MS = 60_000;

/** Rechaza si `promise` no resuelve en `ms` (best-effort: la ficha se publica igual). */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout (${ms} ms) en ${label}`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export interface IngestRunResult {
  jobId: string;
  source: string;
  query: string;
  stats: IngestStats;
  /** Slugs de las fichas creadas en esta ejecucion (para auto-indexacion). */
  createdSlugs: string[];
}

/**
 * Filtro de veracidad: solo dejamos pasar fichas con datos reales suficientes.
 * Exigimos nombre, direccion fisica y al menos un canal de contacto (telefono
 * o web). Asi evitamos publicar fichas "fantasma" o con datos incompletos.
 */
function isVeracious(company: NormalizedCompany): boolean {
  const hasName = Boolean(company.name?.trim());
  const hasAddress = Boolean(company.addressLine?.trim());
  const hasContact = Boolean(company.phone?.trim() || company.website?.trim());
  const hasGeo =
    typeof company.latitude === "number" &&
    typeof company.longitude === "number";
  return hasName && hasAddress && hasContact && hasGeo;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}

function describe(params: IngestParams): string {
  return params.source === "GOOGLE_PLACES"
    ? params.query
    : `${params.category} en ${params.area}`;
}

function fetchCompanies(params: IngestParams): Promise<NormalizedCompany[]> {
  if (params.source === "GOOGLE_PLACES") {
    return searchGooglePlaces(params.query, params.limit ?? 40);
  }
  return searchOpenStreetMap(params.area, params.category, params.limit ?? 60);
}

async function uniqueSlug(name: string, city?: string): Promise<string> {
  const base = toSlug(city ? `${name}-${city}` : name) || "empresa";
  let slug = base;
  let suffix = 2;
  while (
    await prisma.company.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

async function resolveLocation(company: NormalizedCompany) {
  let provinceId: string | null = null;
  let cityId: string | null = null;

  if (company.provinceName) {
    const province = await prisma.province.findUnique({
      where: { slug: toSlug(company.provinceName) },
      select: { id: true },
    });
    provinceId = province?.id ?? null;
  }

  if (company.cityName) {
    const citySlug = toSlug(company.cityName);
    const city = await prisma.city.findFirst({
      where: { slug: citySlug, ...(provinceId ? { provinceId } : {}) },
      select: { id: true, provinceId: true },
    });
    if (city) {
      cityId = city.id;
      provinceId = provinceId ?? city.provinceId;
    } else if (provinceId) {
      const created = await prisma.city.create({
        data: {
          name: company.cityName,
          slug: citySlug,
          provinceId,
          latitude: company.latitude,
          longitude: company.longitude,
        },
        select: { id: true },
      });
      cityId = created.id;
    }
  }

  return { provinceId, cityId };
}

async function recount(
  categoryIds: Set<string>,
  cityIds: Set<string>,
  provinceIds: Set<string>,
) {
  for (const id of categoryIds) {
    const companyCount = await prisma.company.count({
      where: { categoryId: id, status: "PUBLISHED" },
    });
    await prisma.category.update({ where: { id }, data: { companyCount } });
  }
  for (const id of cityIds) {
    const companyCount = await prisma.company.count({
      where: { cityId: id, status: "PUBLISHED" },
    });
    await prisma.city.update({ where: { id }, data: { companyCount } });
  }
  for (const id of provinceIds) {
    const companyCount = await prisma.company.count({
      where: { provinceId: id, status: "PUBLISHED" },
    });
    await prisma.province.update({ where: { id }, data: { companyCount } });
  }
}

export async function runIngestion(
  params: IngestParams,
  options: IngestOptions = {},
): Promise<IngestRunResult> {
  const query = describe(params);
  const job = await prisma.ingestionJob.create({
    data: {
      type: "INGEST",
      source: params.source,
      status: "RUNNING",
      query,
      params: toJson(params),
      startedAt: new Date(),
    },
  });

  const stats: IngestStats = {
    found: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };
  const touchedCategories = new Set<string>();
  const touchedCities = new Set<string>();
  const touchedProvinces = new Set<string>();
  const createdIds: string[] = [];
  const createdSlugs: string[] = [];

  try {
    const companies = await fetchCompanies(params);
    stats.found = companies.length;

    // Respaldo de categoria por intencion de busqueda (solo Google Places).
    const fallbackCategorySlug =
      params.source === "GOOGLE_PLACES" ? params.categorySlug : undefined;

    for (const company of companies) {
      try {
        const categorySlug = company.categorySlug ?? fallbackCategorySlug;
        if (!categorySlug) {
          stats.skipped++;
          continue;
        }
        // Veracidad: descartamos fichas sin datos reales suficientes.
        if (!isVeracious(company)) {
          stats.skipped++;
          continue;
        }
        const category = await prisma.category.findUnique({
          where: { slug: categorySlug },
          select: { id: true },
        });
        if (!category) {
          stats.skipped++;
          continue;
        }

        const { provinceId, cityId } = await resolveLocation(company);
        const data = {
          name: company.name,
          shortDescription: company.shortDescription,
          categoryId: category.id,
          website: company.website,
          phone: company.phone,
          email: company.email,
          addressLine: company.addressLine,
          postalCode: company.postalCode,
          provinceId,
          cityId,
          latitude: company.latitude,
          longitude: company.longitude,
          coverImage: company.coverImage,
          coverImageRef: company.coverImageRef,
          ratingAvg: company.ratingAvg ?? 0,
          reviewCount: company.reviewCount ?? 0,
          openingHours: company.openingHours
            ? toJson(company.openingHours)
            : undefined,
          source: params.source,
          sourceId: company.sourceId,
          sourceUrl: company.sourceUrl,
          lastRefreshedAt: new Date(),
        };

        const existing = await prisma.company.findFirst({
          where: { source: params.source, sourceId: company.sourceId },
          select: { id: true },
        });
        const duplicate =
          !existing && cityId
            ? await prisma.company.findFirst({
                where: { name: company.name, cityId },
                select: { id: true },
              })
            : null;

        if (existing || duplicate) {
          await prisma.company.update({
            where: { id: (existing ?? duplicate)!.id },
            data,
          });
          stats.updated++;
        } else {
          const slug = await uniqueSlug(company.name, company.cityName);
          const created = await prisma.company.create({
            data: { ...data, slug, status: "DRAFT" },
            select: { id: true, slug: true },
          });
          createdIds.push(created.id);
          createdSlugs.push(created.slug);
          stats.created++;
        }

        touchedCategories.add(category.id);
        if (cityId) touchedCities.add(cityId);
        if (provinceId) touchedProvinces.add(provinceId);
      } catch (error) {
        stats.errors++;
        console.error(`Ingesta — error en "${company.name}":`, error);
      }
    }

    // Flujo automatizado (import diario): enriquecer con IA y publicar las
    // fichas nuevas para que aparezcan en el directorio el mismo dia, sin
    // intervencion manual. El enriquecimiento es best-effort: si OpenAI falla
    // o no hay clave, la ficha se publica igualmente con los datos de Maps.
    if (options.autoEnrich && createdIds.length > 0) {
      // Enriquecemos en paralelo con concurrencia acotada: una llamada a OpenAI
      // por ficha en serie agota el tiempo de la funcion serverless y solo
      // entran unas pocas empresas al dia. Por lotes de ENRICH_CONCURRENCY el
      // tiempo total baja ~Nx y la importacion alcanza el tope diario.
      for (let i = 0; i < createdIds.length; i += ENRICH_CONCURRENCY) {
        const batch = createdIds.slice(i, i + ENRICH_CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map((id) =>
            withTimeout(enrichCompany(id), ENRICH_TIMEOUT_MS, `enrich ${id}`),
          ),
        );
        for (const r of results) {
          if (r.status === "rejected") {
            stats.errors++;
            console.error("Ingesta — enriquecimiento fallido:", r.reason);
          }
        }
      }
    }
    if (options.autoPublish && createdIds.length > 0) {
      await prisma.company.updateMany({
        where: { id: { in: createdIds } },
        data: { status: "PUBLISHED" },
      });
    }

    // El recuento se hace despues de publicar para que companyCount refleje
    // las fichas nuevas ya visibles.
    await recount(touchedCategories, touchedCities, touchedProvinces);
    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        stats: toJson(stats),
      },
    });
  } catch (error) {
    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
        stats: toJson(stats),
      },
    });
    throw error;
  }

  return { jobId: job.id, source: params.source, query, stats, createdSlugs };
}
