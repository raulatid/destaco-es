import { NextResponse, type NextRequest } from "next/server";

import { runIngestion, type IngestParams } from "@/lib/ingest/ingest-service";

// La ingesta puede tardar; ampliamos el limite de ejecucion.
export const maxDuration = 60;

/** Plan rotativo para el cron diario (OpenStreetMap — gratis, sin coste de API). */
const ROTATION: { area: string; category: string }[] = [
  { area: "Madrid", category: "restaurantes" },
  { area: "Barcelona", category: "abogados" },
  { area: "Valencia", category: "dentistas" },
  { area: "Sevilla", category: "belleza" },
  { area: "Malaga", category: "reformas" },
  { area: "Zaragoza", category: "fitness" },
  { area: "Bilbao", category: "marketing" },
  { area: "Alicante", category: "inmobiliarias" },
];

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const param = new URL(req.url).searchParams.get("secret");
  return bearer === secret || param === secret;
}

function parseParams(body: Record<string, unknown>): IngestParams | null {
  const limit = typeof body.limit === "number" ? body.limit : undefined;
  if (body.source === "GOOGLE_PLACES" && typeof body.query === "string") {
    return { source: "GOOGLE_PLACES", query: body.query, limit };
  }
  if (
    body.source === "OPENSTREETMAP" &&
    typeof body.area === "string" &&
    typeof body.category === "string"
  ) {
    return {
      source: "OPENSTREETMAP",
      area: body.area,
      category: body.category,
      limit,
    };
  }
  return null;
}

/** Ingesta dirigida — body: { source, query } o { source, area, category }. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* cuerpo vacio */
  }

  const params = parseParams(body);
  if (!params) {
    return NextResponse.json(
      {
        error:
          "Parametros invalidos. Usa { source: 'GOOGLE_PLACES', query } o { source: 'OPENSTREETMAP', area, category }.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await runIngestion(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de ingesta" },
      { status: 500 },
    );
  }
}

/** Ingesta rotativa diaria — la dispara Vercel Cron. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dayIndex =
    Math.floor(Date.now() / 86_400_000) % ROTATION.length;
  const pick = ROTATION[dayIndex];

  try {
    const result = await runIngestion({
      source: "OPENSTREETMAP",
      area: pick.area,
      category: pick.category,
      limit: 80,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de ingesta" },
      { status: 500 },
    );
  }
}
