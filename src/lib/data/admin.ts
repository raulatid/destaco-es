import type { ClaimStatus, CompanyStatus, ReviewStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withFallback } from "./db";

export interface AdminStats {
  total: number;
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  pendingReviews: number;
  jobs: number;
}

export function getAdminStats(): Promise<AdminStats> {
  return withFallback<AdminStats>(
    async () => {
      const [total, draft, pending, published, rejected, pendingReviews, jobs] =
        await Promise.all([
          prisma.company.count(),
          prisma.company.count({ where: { status: "DRAFT" } }),
          prisma.company.count({ where: { status: "PENDING" } }),
          prisma.company.count({ where: { status: "PUBLISHED" } }),
          prisma.company.count({ where: { status: "REJECTED" } }),
          prisma.review.count({ where: { status: "PENDING" } }),
          prisma.ingestionJob.count(),
        ]);
      return {
        total,
        draft,
        pending,
        published,
        rejected,
        pendingReviews,
        jobs,
      };
    },
    () => ({
      total: 0,
      draft: 0,
      pending: 0,
      published: 0,
      rejected: 0,
      pendingReviews: 0,
      jobs: 0,
    }),
  );
}

export interface AdminCompanyRow {
  id: string;
  slug: string;
  name: string;
  status: CompanyStatus;
  category: string;
  city: string | null;
  source: string;
  createdAt: string;
}

export function listAdminCompanies(
  status?: CompanyStatus,
): Promise<AdminCompanyRow[]> {
  return withFallback<AdminCompanyRow[]>(
    async () => {
      const rows = await prisma.company.findMany({
        where: status ? { status } : {},
        include: {
          category: { select: { name: true } },
          city: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      });
      return rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        status: c.status,
        category: c.category.name,
        city: c.city?.name ?? null,
        source: c.source,
        createdAt: c.createdAt.toISOString(),
      }));
    },
    () => [],
  );
}

export interface AdminReviewRow {
  id: string;
  companyName: string;
  companySlug: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  createdAt: string;
}

export function listAdminReviews(
  status?: ReviewStatus,
): Promise<AdminReviewRow[]> {
  return withFallback<AdminReviewRow[]>(
    async () => {
      const rows = await prisma.review.findMany({
        where: status ? { status } : {},
        include: {
          company: { select: { name: true, slug: true } },
          author: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      });
      return rows.map((r) => ({
        id: r.id,
        companyName: r.company.name,
        companySlug: r.company.slug,
        authorName: r.author.name ?? "Usuario de Destaco",
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }));
    },
    () => [],
  );
}

export interface AdminClaimRow {
  id: string;
  companyName: string;
  companySlug: string;
  userName: string;
  claimantEmail: string;
  domainMatch: boolean;
  status: ClaimStatus;
  verified: boolean;
  evidence: string | null;
  createdAt: string;
}

export function listAdminClaims(
  status?: ClaimStatus,
): Promise<AdminClaimRow[]> {
  return withFallback<AdminClaimRow[]>(
    async () => {
      const rows = await prisma.companyClaim.findMany({
        where: status ? { status } : {},
        include: {
          company: { select: { name: true, slug: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      });
      return rows.map((c) => ({
        id: c.id,
        companyName: c.company.name,
        companySlug: c.company.slug,
        userName: c.user.name ?? "Usuario",
        claimantEmail: c.claimantEmail,
        domainMatch: c.domainMatch,
        status: c.status,
        verified: Boolean(c.verifiedAt),
        evidence: c.evidence,
        createdAt: c.createdAt.toISOString(),
      }));
    },
    () => [],
  );
}

export interface AdminJobRow {
  id: string;
  type: string;
  status: string;
  source: string;
  query: string | null;
  stats: unknown;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export function listAdminJobs(): Promise<AdminJobRow[]> {
  return withFallback<AdminJobRow[]>(
    async () => {
      const rows = await prisma.ingestionJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      });
      return rows.map((j) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        source: j.source,
        query: j.query,
        stats: j.stats,
        error: j.error,
        createdAt: j.createdAt.toISOString(),
        finishedAt: j.finishedAt?.toISOString() ?? null,
      }));
    },
    () => [],
  );
}

export interface AdminSeoStats {
  totalPages: number;
  indexable: number;
  noindex: number;
  byStatus: Record<string, number>;
  byKind: Record<string, number>;
}

export interface AdminSeoLogRow {
  id: string;
  action: string;
  targetUrl: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface AdminSeoOverview {
  stats: AdminSeoStats;
  logs: AdminSeoLogRow[];
}

export function getAdminSeoOverview(): Promise<AdminSeoOverview> {
  const empty: AdminSeoOverview = {
    stats: {
      totalPages: 0,
      indexable: 0,
      noindex: 0,
      byStatus: {},
      byKind: {},
    },
    logs: [],
  };

  return withFallback<AdminSeoOverview>(async () => {
    const [totalPages, indexable, byStatusGroups, byKindGroups, logs] =
      await Promise.all([
        prisma.seoPage.count(),
        prisma.seoPage.count({ where: { indexable: true } }),
        prisma.seoPage.groupBy({ by: ["indexStatus"], _count: true }),
        prisma.seoPage.groupBy({ by: ["kind"], _count: true }),
        prisma.searchConsoleLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
      ]);

    const byStatus: Record<string, number> = {};
    for (const g of byStatusGroups) byStatus[g.indexStatus] = g._count;
    const byKind: Record<string, number> = {};
    for (const g of byKindGroups) byKind[g.kind] = g._count;

    return {
      stats: {
        totalPages,
        indexable,
        noindex: totalPages - indexable,
        byStatus,
        byKind,
      },
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        targetUrl: l.targetUrl,
        status: l.status,
        error: l.error,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }, () => empty);
}
