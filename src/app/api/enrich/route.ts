import { NextResponse, type NextRequest } from "next/server";

import { runEnrichment } from "@/lib/ai/enrich-service";

// El enriquecimiento con IA puede tardar; ampliamos el limite de ejecucion.
export const maxDuration = 120;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const param = new URL(req.url).searchParams.get("secret");
  return bearer === secret || param === secret;
}

/** Enriquece un lote de empresas DRAFT con IA. body: { limit?: number } */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let limit = 10;
  try {
    const body = (await req.json()) as { limit?: unknown };
    if (typeof body.limit === "number") limit = body.limit;
  } catch {
    /* cuerpo vacio: se usa el limite por defecto */
  }

  try {
    const result = await runEnrichment({ limit });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error de enriquecimiento",
      },
      { status: 500 },
    );
  }
}
