import { NextResponse, type NextRequest } from "next/server";

import { SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { recomputeRankingScores } from "@/lib/ranking-job";
import {
  inspectUrl,
  searchConsoleEnabled,
  submitSitemap,
} from "@/lib/seo/search-console";
import { nextPagesToInspect, syncSeoPages } from "@/lib/seo/seo-pages";

// Vercel Hobby (plan free) limita las funciones a 60 s. No subir de aqui.
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const param = new URL(req.url).searchParams.get("secret");
  return bearer === secret || param === secret;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "error");

/**
 * Cron de mantenimiento diario consolidado (pensado para Vercel Hobby/free,
 * que solo admite 2 cron jobs). Ejecuta en cadena:
 *   1. Recalculo del ranking de todas las empresas.
 *   2. Sincronizacion de la tabla SeoPage + (si hay credenciales) reenvio del
 *      sitemap a Search Console e inspeccion de un lote pequeno de URLs.
 *
 * Cada paso esta aislado en su try/catch: si uno falla, los demas continuan.
 * El import diario de Google va en su propio cron (/api/import).
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const out: Record<string, unknown> = {};

  // 1. Ranking
  try {
    // snapshots:false ahorra ~1800 escrituras/dia (auditoria innecesaria en
    // el cron diario del plan free); el ranking se cachea igual en Company.
    out.ranking = await recomputeRankingScores({ snapshots: false });
  } catch (e) {
    out.ranking = { error: msg(e) };
  }

  // 2. SEO
  try {
    const sync = await syncSeoPages();
    const scEnabled = searchConsoleEnabled();
    const sitemap = scEnabled
      ? await submitSitemap(`${SITE.url}/sitemap.xml`)
      : { ok: false, skipped: true as const };

    let inspected = 0;
    if (scEnabled) {
      // Lote reducido para no agotar el presupuesto de 60 s del plan free.
      const pages = await nextPagesToInspect(10);
      for (const page of pages) {
        const result = await inspectUrl(`${SITE.url}${page.path}`);
        if (result.skipped) break;
        await prisma.seoPage.update({
          where: { id: page.id },
          data: {
            lastInspected: new Date(),
            ...(result.status ? { indexStatus: result.status } : {}),
          },
        });
        inspected++;
      }
    }
    out.seo = {
      searchConsole: scEnabled ? "enabled" : "disabled",
      sync,
      sitemap,
      inspected,
    };
  } catch (e) {
    out.seo = { error: msg(e) };
  }

  return NextResponse.json({ ok: true, ...out });
}
