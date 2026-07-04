/**
 * Informe periodico de visibilidad por email (lo dispara el cron diario).
 *
 * A cada dueno con empresas publicadas y SIN plan Destacado le enviamos, como
 * mucho cada REPORT_INTERVAL_DAYS, un resumen con sus metricas REALES
 * (apariciones en listados, visitas y contactos) y una llamada a destacar.
 * Con baja RGPD de un clic (statsEmailOptOut) y sin enviar si aun no hay
 * ningun dato que contar (mejor esperar que mandar un correo con ceros).
 */
import { createHmac } from "node:crypto";

import { SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "./resend";
import { statsReportEmail } from "./templates";

const REPORT_INTERVAL_DAYS = 14;

/** Token de baja: HMAC del userId con el secreto de auth (sin nueva clave). */
export function optOutToken(userId: string): string {
  const secret = process.env.AUTH_SECRET ?? "destaco";
  return createHmac("sha256", secret).update(userId).digest("hex").slice(0, 32);
}

export interface StatsReportRun {
  examined: number;
  sent: number;
  skippedNoData: number;
  errors: number;
}

export async function sendStatsReports(limit = 40): Promise<StatsReportRun> {
  const run: StatsReportRun = { examined: 0, sent: 0, skippedNoData: 0, errors: 0 };
  const cutoff = new Date(Date.now() - REPORT_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      statsEmailOptOut: false,
      OR: [{ statsEmailLastAt: null }, { statsEmailLastAt: { lt: cutoff } }],
      ownedCompanies: {
        some: { status: "PUBLISHED" },
        // El informe es para convertir a Destacado: si ya tiene una empresa
        // destacada, no se le envia.
        none: { featured: true },
      },
    },
    orderBy: [{ statsEmailLastAt: { sort: "asc", nulls: "first" } }],
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      ownedCompanies: {
        where: { status: "PUBLISHED" },
        select: {
          name: true,
          viewCount: true,
          impressions: true,
          websiteClicks: true,
          phoneClicks: true,
          emailClicks: true,
          contactClicks: true,
        },
        orderBy: { viewCount: "desc" },
      },
    },
  });

  for (const user of users) {
    run.examined++;
    try {
      const companies = user.ownedCompanies;
      if (!user.email || companies.length === 0) continue;

      const views = companies.reduce((s, c) => s + c.viewCount, 0);
      const impressions = companies.reduce((s, c) => s + c.impressions, 0);
      const clicks = companies.reduce(
        (s, c) =>
          s + c.websiteClicks + c.phoneClicks + c.emailClicks + c.contactClicks,
        0,
      );

      // Sin datos todavia: no sellamos, lo reintentara cuando haya numeros.
      if (views + impressions === 0) {
        run.skippedNoData++;
        continue;
      }

      const optOutUrl = `${SITE.url}/api/email/optout?u=${encodeURIComponent(user.id)}&t=${optOutToken(user.id)}`;
      const { subject, html } = statsReportEmail({
        firstName: user.name?.split(" ")[0] ?? null,
        companyName: companies[0].name,
        hasMore: companies.length > 1,
        views,
        impressions,
        clicks,
        destacarUrl: `${SITE.url}/destacar`,
        optOutUrl,
      });

      const result = await sendEmail({
        to: user.email,
        subject,
        html,
        template: "stats-report",
        metadata: { userId: user.id, views, impressions, clicks },
      });

      if (result.ok) {
        run.sent++;
        await prisma.user.update({
          where: { id: user.id },
          data: { statsEmailLastAt: new Date() },
        });
      } else {
        run.errors++;
      }
    } catch (error) {
      run.errors++;
      console.error("[stats-report] fallo con el usuario:", user.id, error);
    }
  }

  return run;
}
