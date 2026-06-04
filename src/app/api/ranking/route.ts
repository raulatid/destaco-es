import { NextResponse, type NextRequest } from "next/server";

import { recomputeRankingScores } from "@/lib/ranking-job";

// El recalculo recorre todas las empresas; ampliamos el limite de ejecucion.
export const maxDuration = 120;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const param = new URL(req.url).searchParams.get("secret");
  return bearer === secret || param === secret;
}

/** Recalculo del ranking — lo dispara Vercel Cron (GET) o el admin. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await recomputeRankingScores();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de ranking" },
      { status: 500 },
    );
  }
}
