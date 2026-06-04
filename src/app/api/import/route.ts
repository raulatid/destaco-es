import { NextResponse, type NextRequest } from "next/server";

import { runDailyGoogleImport } from "@/lib/ingest/google-daily";

// Vercel Hobby (free) limita a 60 s. En Pro puedes subirlo a 120-300.
export const maxDuration = 60;

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
