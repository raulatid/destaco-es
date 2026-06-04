import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { withFallback } from "./db";
import { demoSiteStats } from "./demo";

export interface SiteStats {
  companies: number;
  cities: number;
  provinces: number;
  categories: number;
}

/** Recuentos reales del directorio (cacheado por render). */
export const getSiteStats = cache(
  (): Promise<SiteStats> =>
    withFallback<SiteStats>(
      async () => {
        const [companies, cities, provinces, categories] = await Promise.all([
          prisma.company.count({ where: { status: "PUBLISHED" } }),
          prisma.city.count({
            where: { companies: { some: { status: "PUBLISHED" } } },
          }),
          prisma.province.count({
            where: { companies: { some: { status: "PUBLISHED" } } },
          }),
          prisma.category.count(),
        ]);
        return { companies, cities, provinces, categories };
      },
      () => demoSiteStats(),
    ),
);
