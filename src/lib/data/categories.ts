import { prisma } from "@/lib/prisma";
import { withFallback } from "./db";
import { demoCategories, demoCategoryBySlug } from "./demo";
import type { CategorySummary } from "./types";

export function listCategories(): Promise<CategorySummary[]> {
  return withFallback<CategorySummary[]>(
    async () => {
      const rows = await prisma.category.findMany({
        where: { parentId: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
      return rows.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon ?? "briefcase",
        companyCount: c.companyCount,
        metaTitle: c.metaTitle,
        metaDescription: c.metaDescription,
      }));
    },
    () => demoCategories(),
  );
}

export function getCategoryBySlug(
  slug: string,
): Promise<CategorySummary | null> {
  return withFallback<CategorySummary | null>(
    async () => {
      const c = await prisma.category.findUnique({ where: { slug } });
      if (!c) return null;
      return {
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon ?? "briefcase",
        companyCount: c.companyCount,
        metaTitle: c.metaTitle,
        metaDescription: c.metaDescription,
      };
    },
    () => demoCategoryBySlug(slug),
  );
}
