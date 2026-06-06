import type { CompanySize, PriceRange } from "@prisma/client";

/** Datos minimos para pintar una tarjeta de empresa. */
export interface CompanyCardData {
  slug: string;
  name: string;
  categoryName: string;
  categoryIcon: string;
  city: string | null;
  shortDescription: string | null;
  coverImage: string | null;
  rating: number;
  reviewCount: number;
  priceRange: number | null;
  verified: boolean;
  featured: boolean;
  /** Empresa premiada/colaboradora (badge especial). */
  award: boolean;
  services: string[];
}

/** Resultado paginado de un listado de empresas. */
export interface CompanyListResult {
  items: CompanyCardData[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CompanyReview {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  reply: string | null;
}

export interface CompanyProject {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  client: string | null;
  result: string | null;
  url: string | null;
  date: string | null;
}

/** Datos completos para la pagina de perfil de una empresa. */
export interface CompanyDetail {
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  coverImage: string | null;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string;
  city: string | null;
  citySlug: string | null;
  province: string | null;
  provinceSlug: string | null;
  addressLine: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  priceRange: number | null;
  priceFrom: number | null;
  founded: number | null;
  size: CompanySize | null;
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  openingHours: Record<string, [string, string][]> | null;
  services: { name: string; description: string | null }[];
  socials: { platform: string; url: string }[];
  faqs: { question: string; answer: string }[];
  reviews: CompanyReview[];
  projects: CompanyProject[];
}

export interface CategorySummary {
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  companyCount: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface ProvinceSummary {
  slug: string;
  name: string;
  companyCount: number;
  autonomousCommunity?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface CitySummary {
  slug: string;
  name: string;
  province: string;
  provinceSlug: string;
  companyCount: number;
}

export const PRICE_RANGE_TO_NUMBER: Record<PriceRange, number> = {
  BUDGET: 1,
  MODERATE: 2,
  PREMIUM: 3,
  LUXURY: 4,
};
