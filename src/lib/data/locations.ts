import { prisma } from "@/lib/prisma";
import { withFallback } from "./db";
import {
  demoCitiesInProvince,
  demoCityBySlug,
  demoProvinceBySlug,
  demoProvinces,
} from "./demo";
import type { CitySummary, ProvinceSummary } from "./types";

export function listProvinces(): Promise<ProvinceSummary[]> {
  return withFallback<ProvinceSummary[]>(
    async () => {
      const rows = await prisma.province.findMany({
        orderBy: { name: "asc" },
      });
      return rows.map((p) => ({
        slug: p.slug,
        name: p.name,
        companyCount: p.companyCount,
        autonomousCommunity: p.autonomousCommunity,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
      }));
    },
    () => demoProvinces(),
  );
}

export function getProvinceBySlug(
  slug: string,
): Promise<ProvinceSummary | null> {
  return withFallback<ProvinceSummary | null>(
    async () => {
      const p = await prisma.province.findUnique({ where: { slug } });
      if (!p) return null;
      return {
        slug: p.slug,
        name: p.name,
        companyCount: p.companyCount,
        autonomousCommunity: p.autonomousCommunity,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
      };
    },
    () => demoProvinceBySlug(slug),
  );
}

export function listCitiesInProvince(
  provinceSlug: string,
): Promise<CitySummary[]> {
  return withFallback<CitySummary[]>(
    async () => {
      const rows = await prisma.city.findMany({
        where: {
          province: { slug: provinceSlug },
          companies: { some: { status: "PUBLISHED" } },
        },
        include: { province: { select: { name: true, slug: true } } },
        orderBy: { companyCount: "desc" },
        take: 60,
      });
      return rows.map((c) => ({
        slug: c.slug,
        name: c.name,
        province: c.province.name,
        provinceSlug: c.province.slug,
        companyCount: c.companyCount,
      }));
    },
    () => demoCitiesInProvince(provinceSlug),
  );
}

export function getCityBySlug(slug: string): Promise<CitySummary | null> {
  return withFallback<CitySummary | null>(
    async () => {
      const c = await prisma.city.findFirst({
        where: { slug },
        include: { province: { select: { name: true, slug: true } } },
      });
      if (!c) return null;
      return {
        slug: c.slug,
        name: c.name,
        province: c.province.name,
        provinceSlug: c.province.slug,
        companyCount: c.companyCount,
      };
    },
    () => demoCityBySlug(slug),
  );
}
