import crypto from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import type { MetricEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Tipos de evento aceptados y el contador agregado que incrementa cada uno.
const COUNTER: Record<MetricEventType, keyof Prisma.CompanyUpdateInput | null> = {
  PROFILE_VIEW: "viewCount",
  LISTING_IMPRESSION: "impressions",
  WEBSITE_CLICK: "websiteClicks",
  PHONE_CLICK: "phoneClicks",
  EMAIL_CLICK: "emailClicks",
  CONTACT_CLICK: "contactClicks",
};

const VALID = new Set(Object.keys(COUNTER));

/** Hash de la IP con sal — nunca almacenamos la IP en claro (RGPD). */
function hashIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim();
  if (!ip) return null;
  const salt = process.env.METRICS_SALT ?? "destaco";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Registra un evento de metrica y actualiza el contador agregado de la empresa.
 * Pensado para llamarse desde el cliente con fetch keepalive / sendBeacon.
 * Body: { slug, type, source? }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug : null;
  const type = typeof body.type === "string" ? body.type : null;
  const source = typeof body.source === "string" ? body.source.slice(0, 200) : null;

  if (!slug || !type || !VALID.has(type)) {
    return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const eventType = type as MetricEventType;
    const counter = COUNTER[eventType];

    await prisma.$transaction([
      prisma.metricEvent.create({
        data: {
          companyId: company.id,
          type: eventType,
          source,
          userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
          ipHash: hashIp(req),
        },
      }),
      ...(counter
        ? [
            prisma.company.update({
              where: { id: company.id },
              data: { [counter]: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 },
    );
  }
}
