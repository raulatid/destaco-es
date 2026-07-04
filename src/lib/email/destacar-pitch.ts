/**
 * Emails de conversion al plan Destacado (los dispara el cron diario).
 *
 * A cada dueno con empresas publicadas y SIN plan Destacado le enviamos un
 * pitch directo ("hasta x10 mas clientes"), personalizado con su categoria,
 * ciudad y competencia real. Maximo 3 toques por usuario, separados al menos
 * PITCH_INTERVAL_DAYS, con asunto distinto en cada toque. Baja RGPD de un
 * clic (statsEmailOptOut).
 */
import { createHmac } from "node:crypto";

import { categoryNoun, SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "./resend";
import { destacarPitchEmail } from "./templates";

const PITCH_INTERVAL_DAYS = 14;
const MAX_TOUCHES = 3;

/** Token de baja: HMAC del userId con el secreto de auth (sin nueva clave). */
export function optOutToken(userId: string): string {
  const secret = process.env.AUTH_SECRET ?? "destaco";
  return createHmac("sha256", secret).update(userId).digest("hex").slice(0, 32);
}

export interface PitchRun {
  examined: number;
  sent: number;
  errors: number;
}

export async function sendDestacarPitches(limit = 40): Promise<PitchRun> {
  const run: PitchRun = { examined: 0, sent: 0, errors: 0 };
  const cutoff = new Date(Date.now() - PITCH_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      statsEmailOptOut: false,
      statsEmailCount: { lt: MAX_TOUCHES },
      OR: [{ statsEmailLastAt: null }, { statsEmailLastAt: { lt: cutoff } }],
      ownedCompanies: {
        some: { status: "PUBLISHED" },
        // Si ya tiene una empresa destacada, no hay nada que venderle aqui.
        none: { featured: true },
      },
    },
    orderBy: [{ statsEmailLastAt: { sort: "asc", nulls: "first" } }],
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      statsEmailCount: true,
      ownedCompanies: {
        where: { status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        take: 1,
        select: {
          name: true,
          categoryId: true,
          cityId: true,
          category: { select: { slug: true, name: true } },
          city: { select: { name: true } },
        },
      },
    },
  });

  for (const user of users) {
    run.examined++;
    try {
      const company = user.ownedCompanies[0];
      if (!user.email || !company) continue;

      // Competencia real: empresas publicadas en su misma categoria (+ciudad).
      const competitors = await prisma.company.count({
        where: {
          status: "PUBLISHED",
          categoryId: company.categoryId,
          ...(company.cityId ? { cityId: company.cityId } : {}),
        },
      });

      const optOutUrl = `${SITE.url}/api/email/optout?u=${encodeURIComponent(user.id)}&t=${optOutToken(user.id)}`;
      const { subject, html } = destacarPitchEmail({
        firstName: user.name?.split(" ")[0] ?? null,
        companyName: company.name,
        categoryNoun: categoryNoun(company.category.slug, company.category.name),
        cityName: company.city?.name ?? null,
        competitors,
        touch: user.statsEmailCount + 1,
        destacarUrl: `${SITE.url}/destacar`,
        optOutUrl,
      });

      const result = await sendEmail({
        to: user.email,
        subject,
        html,
        template: "destacar-pitch",
        metadata: { userId: user.id, touch: user.statsEmailCount + 1, competitors },
      });

      if (result.ok) {
        run.sent++;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            statsEmailLastAt: new Date(),
            statsEmailCount: { increment: 1 },
          },
        });
      } else {
        run.errors++;
      }
    } catch (error) {
      run.errors++;
      console.error("[destacar-pitch] fallo con el usuario:", user.id, error);
    }
  }

  return run;
}
