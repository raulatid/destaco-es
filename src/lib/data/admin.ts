import type { ClaimStatus, CompanyStatus, ReviewStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { withFallback } from "./db";

/** Suscripciones que cuentan como "de pago" activas. */
const PAYING_STATUSES = ["ACTIVE", "TRIALING"] as const;

/**
 * Una empresa cuenta como "alta manual" cuando la creo un usuario desde el
 * panel (source = CLAIMED) y NO procede de una reclamacion de una ficha que ya
 * existia (no tiene filas en CompanyClaim). Asi separamos las altas nuevas de
 * las reclamaciones de perfiles importados.
 */
const MANUAL_COMPANY_WHERE = {
  source: "CLAIMED",
  claims: { none: {} },
} as const;

export interface AdminStats {
  total: number;
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  pendingReviews: number;
  jobs: number;
  // Metricas de negocio
  manualCompanies: number;
  claims: number;
  approvedClaims: number;
  users: number;
  payingCompanies: number;
  payingUsers: number;
}

export function getAdminStats(): Promise<AdminStats> {
  return withFallback<AdminStats>(
    async () => {
      const [
        total,
        draft,
        pending,
        published,
        rejected,
        pendingReviews,
        jobs,
        manualCompanies,
        claims,
        approvedClaims,
        users,
        payingCompanies,
        payingOwners,
      ] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { status: "DRAFT" } }),
        prisma.company.count({ where: { status: "PENDING" } }),
        prisma.company.count({ where: { status: "PUBLISHED" } }),
        prisma.company.count({ where: { status: "REJECTED" } }),
        prisma.review.count({ where: { status: "PENDING" } }),
        prisma.ingestionJob.count(),
        prisma.company.count({ where: MANUAL_COMPANY_WHERE }),
        prisma.companyClaim.count(),
        prisma.companyClaim.count({ where: { status: "APPROVED" } }),
        prisma.user.count(),
        prisma.subscription.count({
          where: { status: { in: [...PAYING_STATUSES] } },
        }),
        prisma.company.findMany({
          where: {
            ownerId: { not: null },
            subscription: { status: { in: [...PAYING_STATUSES] } },
          },
          select: { ownerId: true },
          distinct: ["ownerId"],
        }),
      ]);
      return {
        total,
        draft,
        pending,
        published,
        rejected,
        pendingReviews,
        jobs,
        manualCompanies,
        claims,
        approvedClaims,
        users,
        payingCompanies,
        payingUsers: payingOwners.length,
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
      manualCompanies: 0,
      claims: 0,
      approvedClaims: 0,
      users: 0,
      payingCompanies: 0,
      payingUsers: 0,
    }),
  );
}

// ------------------------------------------------------------
// SERIES TEMPORALES (para las graficas de seguimiento del panel)
// ------------------------------------------------------------

export interface TrendPoint {
  /** Clave de mes "YYYY-MM". */
  month: string;
  /** Etiqueta corta del mes ("ene", "feb"...). */
  label: string;
  /** Valor acumulado hasta el final de ese mes. */
  value: number;
}

export interface AdminTrends {
  manualCompanies: TrendPoint[];
  claims: TrendPoint[];
  users: TrendPoint[];
  payingCompanies: TrendPoint[];
}

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const TREND_MONTHS = 12;

/** Ventana de los ultimos {@link TREND_MONTHS} meses (en UTC, dia 1 de cada mes). */
function monthBuckets(): { key: string; start: Date; label: string }[] {
  const now = new Date();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const out: { key: string; start: Date; label: string }[] = [];
  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() - i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ key, start: d, label: MONTH_LABELS[d.getUTCMonth()] });
  }
  return out;
}

/** Convierte recuentos mensuales + base previa en una serie acumulada. */
function cumulative(
  monthly: { ym: string; n: number }[],
  baseline: number,
  buckets: { key: string; start: Date; label: string }[],
): TrendPoint[] {
  const map = new Map(monthly.map((m) => [m.ym, Number(m.n)]));
  let running = baseline;
  return buckets.map((b) => {
    running += map.get(b.key) ?? 0;
    return { month: b.key, label: b.label, value: running };
  });
}

type MonthlyRow = { ym: string; n: number };

/**
 * Series de seguimiento (acumuladas) de los ultimos 12 meses para las 4
 * metricas de negocio: altas manuales, reclamaciones de perfil, usuarios
 * registrados y empresas de pago. Cada punto es el total acumulado a fin de mes.
 */
export function getAdminTrends(): Promise<AdminTrends> {
  const empty: AdminTrends = {
    manualCompanies: [],
    claims: [],
    users: [],
    payingCompanies: [],
  };

  return withFallback<AdminTrends>(async () => {
    const buckets = monthBuckets();
    const since = buckets[0].start;

    const [
      manualBase,
      claimsBase,
      usersBase,
      payingBase,
      manualMonthly,
      claimsMonthly,
      usersMonthly,
      payingMonthly,
    ] = await Promise.all([
      prisma.company.count({
        where: { ...MANUAL_COMPANY_WHERE, createdAt: { lt: since } },
      }),
      prisma.companyClaim.count({ where: { createdAt: { lt: since } } }),
      prisma.user.count({ where: { createdAt: { lt: since } } }),
      prisma.subscription.count({
        where: {
          status: { in: [...PAYING_STATUSES] },
          createdAt: { lt: since },
        },
      }),
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT to_char(date_trunc('month', c."createdAt"), 'YYYY-MM') AS ym,
               count(*)::int AS n
        FROM "Company" c
        WHERE c."createdAt" >= ${since}
          AND c."source" = 'CLAIMED'
          AND NOT EXISTS (
            SELECT 1 FROM "CompanyClaim" cc WHERE cc."companyId" = c."id"
          )
        GROUP BY 1`,
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
               count(*)::int AS n
        FROM "CompanyClaim"
        WHERE "createdAt" >= ${since}
        GROUP BY 1`,
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
               count(*)::int AS n
        FROM "User"
        WHERE "createdAt" >= ${since}
        GROUP BY 1`,
      prisma.$queryRaw<MonthlyRow[]>`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS ym,
               count(*)::int AS n
        FROM "Subscription"
        WHERE "createdAt" >= ${since}
          AND "status" IN ('ACTIVE', 'TRIALING')
        GROUP BY 1`,
    ]);

    return {
      manualCompanies: cumulative(manualMonthly, manualBase, buckets),
      claims: cumulative(claimsMonthly, claimsBase, buckets),
      users: cumulative(usersMonthly, usersBase, buckets),
      payingCompanies: cumulative(payingMonthly, payingBase, buckets),
    };
  }, () => empty);
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

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  companyCount: number;
  createdAt: string;
}

export function listAdminUsers(): Promise<AdminUserRow[]> {
  return withFallback<AdminUserRow[]>(
    async () => {
      const rows = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { ownedCompanies: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      return rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        companyCount: u._count.ownedCompanies,
        createdAt: u.createdAt.toISOString(),
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
