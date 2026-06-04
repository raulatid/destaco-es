import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SortOption } from "@/lib/ranking";
import { withFallback } from "./db";
import {
  demoClaimInfo,
  demoCompanyDetail,
  demoFeatured,
  demoListCompanies,
} from "./demo";
import {
  PRICE_RANGE_TO_NUMBER,
  type CompanyCardData,
  type CompanyDetail,
  type CompanyListResult,
} from "./types";

const PER_PAGE = 12;

// ---- Tarjetas de empresa --------------------------------------------------

const cardSelect = {
  slug: true,
  name: true,
  shortDescription: true,
  coverImage: true,
  ratingAvg: true,
  reviewCount: true,
  priceRange: true,
  verified: true,
  featured: true,
  category: { select: { name: true, icon: true } },
  city: { select: { name: true } },
  services: { select: { name: true }, orderBy: { order: "asc" }, take: 4 },
} satisfies Prisma.CompanySelect;

type CardRow = Prisma.CompanyGetPayload<{ select: typeof cardSelect }>;

function rowToCard(row: CardRow): CompanyCardData {
  return {
    slug: row.slug,
    name: row.name,
    categoryName: row.category.name,
    categoryIcon: row.category.icon ?? "briefcase",
    city: row.city?.name ?? null,
    shortDescription: row.shortDescription,
    coverImage: row.coverImage,
    rating: row.ratingAvg,
    reviewCount: row.reviewCount,
    priceRange: row.priceRange ? PRICE_RANGE_TO_NUMBER[row.priceRange] : null,
    verified: row.verified,
    featured: row.featured,
    services: row.services.map((s) => s.name),
  };
}

// ---- Listado paginado -----------------------------------------------------

export interface ListCompaniesParams {
  categorySlug?: string;
  citySlug?: string;
  provinceSlug?: string;
  query?: string;
  page?: number;
  perPage?: number;
  sort?: SortOption;
  verifiedOnly?: boolean;
  minRating?: number;
}

/** Traduce la opcion de orden de la UI a un orderBy de Prisma. */
function orderByFor(sort: SortOption = "score"): Prisma.CompanyOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ ratingAvg: "desc" }, { reviewCount: "desc" }];
    case "reviews":
      return [{ reviewCount: "desc" }, { ratingAvg: "desc" }];
    case "views":
      return [{ viewCount: "desc" }, { rankingScore: "desc" }];
    case "recent":
      return [{ createdAt: "desc" }];
    case "score":
    default:
      // Las destacadas primero, luego por puntuacion interna.
      return [{ featured: "desc" }, { rankingScore: "desc" }, { ratingAvg: "desc" }];
  }
}

export function listCompanies(
  params: ListCompaniesParams = {},
): Promise<CompanyListResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE;

  return withFallback<CompanyListResult>(
    async () => {
      const where: Prisma.CompanyWhereInput = {
        status: "PUBLISHED",
        ...(params.categorySlug && {
          category: { slug: params.categorySlug },
        }),
        ...(params.citySlug && { city: { slug: params.citySlug } }),
        ...(params.provinceSlug && {
          province: { slug: params.provinceSlug },
        }),
        ...(params.verifiedOnly && { verified: true }),
        ...(params.minRating && { ratingAvg: { gte: params.minRating } }),
        ...(params.query && {
          OR: [
            { name: { contains: params.query, mode: "insensitive" } },
            {
              shortDescription: {
                contains: params.query,
                mode: "insensitive",
              },
            },
          ],
        }),
      };

      const [total, rows] = await Promise.all([
        prisma.company.count({ where }),
        prisma.company.findMany({
          where,
          select: cardSelect,
          orderBy: orderByFor(params.sort),
          skip: (page - 1) * perPage,
          take: perPage,
        }),
      ]);

      return {
        items: rows.map(rowToCard),
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      };
    },
    () =>
      demoListCompanies({
        categorySlug: params.categorySlug,
        citySlug: params.citySlug,
        provinceSlug: params.provinceSlug,
        query: params.query,
        page,
        perPage,
        sort: params.sort,
        verifiedOnly: params.verifiedOnly,
        minRating: params.minRating,
      }),
  );
}

export function getFeaturedCompanies(limit = 6): Promise<CompanyCardData[]> {
  return withFallback<CompanyCardData[]>(
    async () => {
      const rows = await prisma.company.findMany({
        where: { status: "PUBLISHED" },
        select: cardSelect,
        orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }],
        take: limit,
      });
      return rows.map(rowToCard);
    },
    () => demoFeatured(limit),
  );
}

// ---- Detalle de empresa ---------------------------------------------------

const detailInclude = {
  category: { select: { name: true, slug: true, icon: true } },
  city: { select: { name: true, slug: true } },
  province: { select: { name: true, slug: true } },
  services: { orderBy: { order: "asc" } },
  socials: true,
  faqs: { orderBy: { order: "asc" } },
  reviews: {
    where: { status: "APPROVED" },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  },
  projects: {
    where: { published: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 12,
  },
} satisfies Prisma.CompanyInclude;

type DetailRow = Prisma.CompanyGetPayload<{ include: typeof detailInclude }>;

function rowToDetail(row: DetailRow): CompanyDetail {
  return {
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.descriptionAI ?? row.description,
    coverImage: row.coverImage,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
    categoryIcon: row.category.icon ?? "briefcase",
    city: row.city?.name ?? null,
    citySlug: row.city?.slug ?? null,
    province: row.province?.name ?? null,
    provinceSlug: row.province?.slug ?? null,
    addressLine: row.addressLine,
    postalCode: row.postalCode,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    website: row.website,
    priceRange: row.priceRange ? PRICE_RANGE_TO_NUMBER[row.priceRange] : null,
    founded: row.founded,
    verified: row.verified,
    featured: row.featured,
    rating: row.ratingAvg,
    reviewCount: row.reviewCount,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    openingHours:
      (row.openingHours as unknown as CompanyDetail["openingHours"]) ?? null,
    services: row.services.map((s) => ({
      name: s.name,
      description: s.description,
    })),
    socials: row.socials.map((s) => ({ platform: s.platform, url: s.url })),
    faqs: row.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    reviews: row.reviews.map((r) => ({
      id: r.id,
      authorName: r.author.name ?? "Usuario de Destaco",
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      reply: r.reply,
    })),
    projects: row.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coverImage: p.coverImage,
      client: p.client,
      result: p.result,
      url: p.url,
      date: p.date?.toISOString() ?? null,
    })),
  };
}

export interface CompanyClaimInfo {
  name: string;
  slug: string;
  claimed: boolean;
}

/** Datos minimos para la pagina de reclamacion de perfil. */
export function getCompanyClaimInfo(
  slug: string,
): Promise<CompanyClaimInfo | null> {
  return withFallback<CompanyClaimInfo | null>(
    async () => {
      const row = await prisma.company.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: { name: true, slug: true, ownerId: true },
      });
      return row
        ? { name: row.name, slug: row.slug, claimed: Boolean(row.ownerId) }
        : null;
    },
    () => demoClaimInfo(slug),
  );
}

export function getCompanyBySlug(slug: string): Promise<CompanyDetail | null> {
  return withFallback<CompanyDetail | null>(
    async () => {
      const row = await prisma.company.findFirst({
        where: { slug, status: "PUBLISHED" },
        include: detailInclude,
      });
      return row ? rowToDetail(row) : null;
    },
    () => demoCompanyDetail(slug),
  );
}
