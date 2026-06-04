import { NextResponse, type NextRequest } from "next/server";

import { SITE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  inspectUrl,
  searchConsoleEnabled,
  submitSitemap,
} from "@/lib/seo/search-console";
import { nextPagesToInspect, syncSeoPages } from "@/lib/seo/seo-pages";

export const maxDuration = 120;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const param = new URL(req.url).searchParams.get("secret");
  return bearer === secret || param === secret;
}

/**
 * Mantenimiento SEO diario (lo dispara Vercel Cron):
 *  1. Sincroniza la tabla SeoPage con el estado real de la BD.
 *  2. Reenvia el sitemap a Search Console (si hay credenciales).
 *  3. Inspecciona un lote de URLs para refrescar su estado de indexacion.
 *
 * NOTA: esto no fuerza ni garantiza la indexacion; solo informa a Google y
 * consulta el estado que el propio Google reporta.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sync = await syncSeoPages();

  const scEnabled = searchConsoleEnabled();
  const sitemap = scEnabled
    ? await submitSitemap(`${SITE.url}/sitemap.xml`)
    : { ok: false, skipped: true as const };

  // Lote pequeno para respetar la cuota diaria de la API.
  const inspected: { path: string; status?: string }[] = [];
  if (scEnabled) {
    const pages = await nextPagesToInspect(20);
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
      inspected.push({ path: page.path, status: result.status });
    }
  }

  return NextResponse.json({
    searchConsole: scEnabled ? "enabled" : "disabled",
    sync,
    sitemap,
    inspected: inspected.length,
    inspectedPages: inspected,
  });
}
