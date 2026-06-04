/**
 * Recalculo masivo del ranking. Recorre las empresas publicadas, calcula la
 * puntuacion con `calculateBusinessRankingScore`, la cachea en
 * `Company.rankingScore` + `Company.completionScore` y guarda un
 * `RankingSnapshot` para poder auditar la evolucion.
 *
 * Pensado para ejecutarse a diario (cron) y bajo demanda desde el admin.
 */
import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import {
  calculateBusinessRankingScore,
  computeCompletionScore,
  type ProfileCompletionInput,
} from "./ranking";

const BATCH = 200;

export interface RankingJobResult {
  processed: number;
  updated: number;
  durationMs: number;
}

export interface RankingJobOptions {
  /**
   * Guardar un RankingSnapshot por empresa (auditoria). Se desactiva en el
   * cron consolidado del plan free para ahorrar escrituras y almacenamiento.
   */
  snapshots?: boolean;
}

function completionFrom(company: {
  description: string | null;
  descriptionAI: string | null;
  logo: string | null;
  coverImage: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  openingHours: unknown;
  _count: { services: number; images: number };
}): ProfileCompletionInput {
  return {
    hasDescription: Boolean(company.descriptionAI ?? company.description),
    hasLogo: Boolean(company.logo),
    hasCover: Boolean(company.coverImage),
    hasWebsite: Boolean(company.website),
    hasPhone: Boolean(company.phone),
    hasEmail: Boolean(company.email),
    hasAddress: Boolean(company.addressLine),
    hasOpeningHours: Boolean(company.openingHours),
    serviceCount: company._count.services,
    imageCount: company._count.images,
  };
}

export async function recomputeRankingScores(
  options: RankingJobOptions = {},
): Promise<RankingJobResult> {
  const { snapshots = true } = options;
  const start = Date.now();
  let processed = 0;
  let updated = 0;
  let cursor: string | undefined;

  for (;;) {
    const companies = await prisma.company.findMany({
      where: { status: "PUBLISHED" },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        ratingAvg: true,
        reviewCount: true,
        verified: true,
        viewCount: true,
        websiteClicks: true,
        phoneClicks: true,
        emailClicks: true,
        contactClicks: true,
        lastRefreshedAt: true,
        lastEnrichedAt: true,
        updatedAt: true,
        createdAt: true,
        description: true,
        descriptionAI: true,
        logo: true,
        coverImage: true,
        website: true,
        phone: true,
        email: true,
        addressLine: true,
        openingHours: true,
        _count: { select: { services: true, images: true, projects: true } },
      },
    });
    if (companies.length === 0) break;

    const now = new Date();
    const snapshotRows: {
      companyId: string;
      score: number;
      rating: number;
      reviews: number;
      projects: number;
      completion: number;
      engagement: number;
      freshness: number;
      penalty: number;
    }[] = [];

    // Calculo (CPU, en serie) + acumulacion de filas para los snapshots.
    const updates = companies.map((c) => {
      const completion = completionFrom(c);
      const breakdown = calculateBusinessRankingScore({
        ratingAvg: c.ratingAvg,
        reviewCount: c.reviewCount,
        projectCount: c._count.projects,
        verified: c.verified,
        viewCount: c.viewCount,
        websiteClicks: c.websiteClicks,
        phoneClicks: c.phoneClicks,
        emailClicks: c.emailClicks,
        contactClicks: c.contactClicks,
        lastRefreshedAt: c.lastRefreshedAt,
        lastEnrichedAt: c.lastEnrichedAt,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
        completion,
      });

      if (snapshots) {
        snapshotRows.push({
          companyId: c.id,
          score: breakdown.score,
          rating: breakdown.rating,
          reviews: breakdown.reviews,
          projects: breakdown.projects,
          completion: breakdown.completion,
          engagement: breakdown.engagement,
          freshness: breakdown.freshness,
          penalty: breakdown.penalty,
        });
      }

      return {
        id: c.id,
        rankingScore: breakdown.score,
        completionScore: computeCompletionScore(completion),
      };
    });

    // Un solo UPDATE masivo por lote (UPDATE ... FROM VALUES) en vez de 1 query
    // por empresa: ~200 filas en 1 round-trip. Pasa de ~90 s a unos pocos
    // segundos y cabe holgado en el limite de 60 s del plan free de Vercel.
    if (updates.length > 0) {
      const rows = Prisma.join(
        updates.map(
          (u) =>
            Prisma.sql`(${u.id}, ${u.rankingScore}::double precision, ${u.completionScore}::double precision)`,
        ),
      );
      await prisma.$executeRaw`
        UPDATE "Company" AS c
        SET "rankingScore" = v.score,
            "completionScore" = v.completion,
            "lastRankedAt" = ${now}
        FROM (VALUES ${rows}) AS v(id, score, completion)
        WHERE c.id = v.id
      `;
    }

    // Insercion masiva de snapshots (una sola query por lote) si estan activos.
    if (snapshots && snapshotRows.length > 0) {
      await prisma.rankingSnapshot.createMany({ data: snapshotRows });
    }

    processed += companies.length;
    updated += updates.length;

    cursor = companies[companies.length - 1].id;
    if (companies.length < BATCH) break;
  }

  return { processed, updated, durationMs: Date.now() - start };
}
