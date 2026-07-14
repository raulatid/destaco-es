/**
 * Orquestador del enriquecimiento con IA.
 * Toma empresas en estado DRAFT (recien ingeridas), genera contenido con
 * OpenAI y las pasa a PENDING — listas para que el administrador las apruebe.
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../prisma";
import { enrichCompanyData, type Enrichment } from "./enrich";

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}

/** Enriquece una empresa concreta y la deja en estado PENDING. */
export async function enrichCompany(companyId: string): Promise<Enrichment> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { category: true, city: true, province: true, services: true },
  });
  if (!company) {
    throw new Error(`Empresa ${companyId} no encontrada.`);
  }

  const enrichment = await enrichCompanyData({
    name: company.name,
    categoryName: company.category.name,
    city: company.city?.name,
    province: company.province?.name,
    website: company.website,
    existingDescription: company.description,
    existingServices: company.services.map((s) => s.name),
  });

  await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: companyId },
      data: {
        shortDescription:
          company.shortDescription ?? enrichment.shortDescription,
        descriptionAI: enrichment.description,
        professionalProfile: enrichment.professionalProfile,
        metaTitle: enrichment.metaTitle,
        metaDescription: enrichment.metaDescription,
        keywords: enrichment.keywords,
        status: "PENDING",
        lastEnrichedAt: new Date(),
      },
    });

    // FAQs: si el dueño puso FAQs propias (no generadas por IA) mandan las
    // suyas y no tocamos nada. Si no, (re)generamos las de IA.
    const ownerFaqs = await tx.faq.count({
      where: { companyId, generatedByAI: false },
    });
    if (ownerFaqs === 0) {
      await tx.faq.deleteMany({ where: { companyId, generatedByAI: true } });
      await tx.faq.createMany({
        data: enrichment.faqs.map((faq, i) => ({
          companyId,
          question: faq.question,
          answer: faq.answer,
          generatedByAI: true,
          order: i,
        })),
      });
    }

    // Servicios: solo se anaden si la empresa no tenia ninguno.
    if (company.services.length === 0) {
      await tx.service.createMany({
        data: enrichment.services.map((service, i) => ({
          companyId,
          name: service.name,
          description: service.description,
          order: i,
        })),
      });
    }
  });

  return enrichment;
}

export interface EnrichmentRunResult {
  jobId: string;
  stats: { found: number; enriched: number; errors: number };
}

/** Enriquece un lote de empresas en estado DRAFT. */
export async function runEnrichment(
  { limit = 10 }: { limit?: number } = {},
): Promise<EnrichmentRunResult> {
  const job = await prisma.ingestionJob.create({
    data: {
      type: "ENRICH",
      source: "MANUAL",
      status: "RUNNING",
      query: `Enriquecimiento IA (lote de ${limit})`,
      startedAt: new Date(),
    },
  });

  const stats = { found: 0, enriched: 0, errors: 0 };

  try {
    const companies = await prisma.company.findMany({
      where: { status: "DRAFT" },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    stats.found = companies.length;

    for (const company of companies) {
      try {
        await enrichCompany(company.id);
        stats.enriched++;
      } catch (error) {
        stats.errors++;
        console.error(
          `Enriquecimiento — error en "${company.name}":`,
          error,
        );
      }
    }

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

  return { jobId: job.id, stats };
}
