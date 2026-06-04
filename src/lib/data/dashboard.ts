import type { CompanyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withFallback } from "./db";

export interface MyCompanyRow {
  id: string;
  slug: string;
  name: string;
  status: CompanyStatus;
  category: string;
  city: string | null;
  ratingAvg: number;
  reviewCount: number;
  viewCount: number;
}

export function getMyCompanies(ownerId: string): Promise<MyCompanyRow[]> {
  return withFallback<MyCompanyRow[]>(
    async () => {
      const rows = await prisma.company.findMany({
        where: { ownerId },
        include: {
          category: { select: { name: true } },
          city: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        status: c.status,
        category: c.category.name,
        city: c.city?.name ?? null,
        ratingAvg: c.ratingAvg,
        reviewCount: c.reviewCount,
        viewCount: c.viewCount,
      }));
    },
    () => [],
  );
}

export interface DashboardProject {
  id: string;
  title: string;
  client: string | null;
  url: string | null;
  date: string | null;
  createdAt: string;
}

export interface CompanyProjectsView {
  companyId: string;
  companyName: string;
  companySlug: string;
  projects: DashboardProject[];
}

export function getMyCompanyProjects(
  ownerId: string,
  companyId: string,
): Promise<CompanyProjectsView | null> {
  return withFallback<CompanyProjectsView | null>(
    async () => {
      const company = await prisma.company.findFirst({
        where: { id: companyId, ownerId },
        select: {
          id: true,
          name: true,
          slug: true,
          projects: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!company) return null;
      return {
        companyId: company.id,
        companyName: company.name,
        companySlug: company.slug,
        projects: company.projects.map((p) => ({
          id: p.id,
          title: p.title,
          client: p.client,
          url: p.url,
          date: p.date?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        })),
      };
    },
    () => null,
  );
}

export interface CompanyMetrics {
  companyId: string;
  name: string;
  slug: string;
  viewCount: number;
  websiteClicks: number;
  phoneClicks: number;
  emailClicks: number;
  contactClicks: number;
  impressions: number;
  reviewCount: number;
  rankingScore: number;
  completionScore: number;
  ctr: number; // clics de intencion / impresiones
}

export function getMyCompanyMetrics(ownerId: string): Promise<CompanyMetrics[]> {
  return withFallback<CompanyMetrics[]>(
    async () => {
      const rows = await prisma.company.findMany({
        where: { ownerId },
        orderBy: { rankingScore: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          viewCount: true,
          websiteClicks: true,
          phoneClicks: true,
          emailClicks: true,
          contactClicks: true,
          impressions: true,
          reviewCount: true,
          rankingScore: true,
          completionScore: true,
        },
      });
      return rows.map((c) => {
        const clicks =
          c.websiteClicks + c.phoneClicks + c.emailClicks + c.contactClicks;
        return {
          companyId: c.id,
          name: c.name,
          slug: c.slug,
          viewCount: c.viewCount,
          websiteClicks: c.websiteClicks,
          phoneClicks: c.phoneClicks,
          emailClicks: c.emailClicks,
          contactClicks: c.contactClicks,
          impressions: c.impressions,
          reviewCount: c.reviewCount,
          rankingScore: c.rankingScore,
          completionScore: c.completionScore,
          ctr: c.impressions > 0 ? clicks / c.impressions : 0,
        };
      });
    },
    () => [],
  );
}

export interface EditableCompany {
  id: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  addressLine: string;
  postalCode: string;
  provinceSlug: string;
  cityName: string;
}

export function getMyCompany(
  ownerId: string,
  companyId: string,
): Promise<EditableCompany | null> {
  return withFallback<EditableCompany | null>(
    async () => {
      const c = await prisma.company.findFirst({
        where: { id: companyId, ownerId },
        include: {
          category: { select: { slug: true } },
          province: { select: { slug: true } },
          city: { select: { name: true } },
        },
      });
      if (!c) return null;
      return {
        id: c.id,
        name: c.name,
        categorySlug: c.category.slug,
        shortDescription: c.shortDescription ?? "",
        description: c.description ?? "",
        website: c.website ?? "",
        phone: c.phone ?? "",
        email: c.email ?? "",
        addressLine: c.addressLine ?? "",
        postalCode: c.postalCode ?? "",
        provinceSlug: c.province?.slug ?? "",
        cityName: c.city?.name ?? "",
      };
    },
    () => null,
  );
}
