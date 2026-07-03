/**
 * Salud de las fotos de portada.
 *
 * Las photoUri de Google Places (lh3.googleusercontent) CADUCAN: pasadas unas
 * semanas Google devuelve 403 y la ficha muestra una imagen rota. Este barrido
 * rotatorio comprueba las URLs por lotes y, para las rotas:
 *   1. Refresca la URL con la referencia estable (coverImageRef) si la hay.
 *   2. Si no hay referencia pero si place id (sourceId), la recupera con una
 *      llamada a Place Details (campo photos) y refresca.
 *   3. Si no se puede recuperar, limpia coverImage (la ficha vuelve al
 *      monograma, nunca a una imagen rota).
 *
 * Solo gasta API en las fotos ROTAS; las comprobaciones son GETs gratuitos a
 * googleusercontent. Lo ejecuta el cron de /api/import tras cada pasada.
 */
import { prisma } from "../prisma";
import { fetchFirstPhotoRef, resolvePhotoUri } from "./google-places";

const CHECK_CONCURRENCY = 12;

export interface PhotoHealthStats {
  checked: number;
  ok: number;
  refreshed: number;
  refRecovered: number;
  cleared: number;
  apiCalls: number;
  errors: number;
}

/** Estado de una URL de imagen: ok | rota (definitivo) | desconocido (red). */
async function probe(url: string): Promise<"ok" | "broken" | "unknown"> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    // Cerramos el cuerpo sin leerlo entero (solo nos interesa el status).
    try {
      await res.body?.cancel();
    } catch {
      /* ignorable */
    }
    if (res.status >= 200 && res.status < 400) return "ok";
    if ([403, 404, 410].includes(res.status)) return "broken";
    return "unknown"; // 5xx/429: no tocamos nada, se reintenta otro dia.
  } catch {
    return "unknown";
  }
}

export async function photoHealthSweep(opts?: {
  batch?: number;
  budgetMs?: number;
}): Promise<PhotoHealthStats> {
  const batch = opts?.batch ?? 350;
  const deadline = Date.now() + (opts?.budgetMs ?? 90_000);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const stats: PhotoHealthStats = {
    checked: 0,
    ok: 0,
    refreshed: 0,
    refRecovered: 0,
    cleared: 0,
    apiCalls: 0,
    errors: 0,
  };

  // Lote rotatorio: primero las nunca comprobadas, luego las mas antiguas.
  const rows = await prisma.company.findMany({
    where: { coverImage: { startsWith: "http" } },
    orderBy: [{ coverImageCheckedAt: { sort: "asc", nulls: "first" } }],
    take: batch,
    select: {
      id: true,
      coverImage: true,
      coverImageRef: true,
      source: true,
      sourceId: true,
    },
  });

  async function heal(row: (typeof rows)[number]): Promise<void> {
    const now = new Date();
    const status = await probe(row.coverImage!);
    stats.checked++;

    if (status === "ok") {
      stats.ok++;
      await prisma.company.update({
        where: { id: row.id },
        data: { coverImageCheckedAt: now },
      });
      return;
    }
    if (status === "unknown") {
      // Fallo de red/5xx: ni sanamos ni sellamos, que lo reintente otro dia.
      return;
    }

    // Rota de verdad (403/404/410): intentamos refrescar.
    let ref = row.coverImageRef;
    if (!ref && apiKey && row.source === "GOOGLE_PLACES" && row.sourceId) {
      stats.apiCalls++;
      ref = (await fetchFirstPhotoRef(row.sourceId, apiKey)) ?? null;
      if (ref) stats.refRecovered++;
    }

    let freshUri: string | undefined;
    if (ref && apiKey) {
      stats.apiCalls++;
      freshUri = await resolvePhotoUri(ref, apiKey);
    }

    if (freshUri) {
      stats.refreshed++;
      await prisma.company.update({
        where: { id: row.id },
        data: {
          coverImage: freshUri,
          coverImageRef: ref,
          coverImageCheckedAt: now,
        },
      });
    } else {
      // Sin foto recuperable: mejor monograma limpio que imagen rota.
      stats.cleared++;
      await prisma.company.update({
        where: { id: row.id },
        data: {
          coverImage: null,
          coverImageRef: ref,
          coverImageCheckedAt: now,
        },
      });
    }
  }

  // Pool de concurrencia acotada con corte por presupuesto de tiempo.
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length && Date.now() < deadline) {
      const row = rows[cursor++];
      try {
        await heal(row);
      } catch {
        stats.errors++;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CHECK_CONCURRENCY, rows.length) }, worker),
  );

  return stats;
}
