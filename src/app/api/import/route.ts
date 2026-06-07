import { NextResponse, type NextRequest } from "next/server";

import { runDailyGoogleImport } from "@/lib/ingest/google-daily";

// El import diario enriquece con IA (en paralelo) y publica hasta ~100 fichas,
// lo que requiere mas de 60 s. Necesita plan Vercel Pro (limite 300 s). En
// Hobby/free el limite real es 60 s: ahi no caben 100 fichas con IA, baja
// DAILY_NEW_CAP/DAILY_QUERY_BUDGET en google-daily.ts.
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const param = new URL(req.url).searchParams.get("secret");
  return bearer === secret || param === secret;
}

/**
 * Importacion diaria desde Google Places (la dispara Vercel Cron).
 * Trae 20 fichas nuevas con control de cuota: una vez al dia como maximo.
 * Usa ?force=1 para forzar una ejecucion manual desde el admin.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const force = new URL(req.url).searchParams.get("force") === "1";

  try {
    const result = await runDailyGoogleImport(force);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error en la importacion",
      },
      { status: 500 },
    );
  }
}
