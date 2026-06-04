/**
 * Orquestador de ingesta: descarga de la fuente, normaliza, deduplica,
 * resuelve geografia y persiste en PostgreSQL registrando un IngestionJob.
 *
 * Las empresas se crean en estado DRAFT — la etapa de enriquecimiento con IA
 * (ENRICH) y la aprobacion del admin las pasan a PUBLISHED.
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../prisma";
import { toSlug } from "./geo";
import { searchGooglePlaces } from "./google-places";
import { searchOpenStreetMap } from "./openstreetmap";
import type { IngestStats, NormalizedCompany } from "./types";

export type IngestParams =
  | { source: "GOOGLE_PLACES"; query: string; limit?: number }
  | { source: "OPENSTREETMAP"; area: string; category: string; limit?: number };

export interface IngestRunResult {
  jobId: string;
  source: string;
  query: string;
  stats: IngestStats;
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

  try {
    const companies = await fetchCompanies(params);
    stats.found = companies.length;

    for (const company of companies) {
      try {
        if (!company.categorySlug) {
          stats.skipped++;
          continue;
        }
        const category = await prisma.category.findUnique({
          where: { slug: company.categorySlug },
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
          await prisma.company.create({
            data: { ...data, slug, status: "DRAFT" },
          });
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

  return { jobId: job.id, source: params.source, query, stats };
}
