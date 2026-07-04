import { NextResponse, type NextRequest } from "next/server";

import { optOutToken } from "@/lib/email/destacar-pitch";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Baja de los informes por email (enlace del pie del correo, RGPD).
 * GET /api/email/optout?u=<userId>&t=<hmac> — sin login: el token firmado
 * demuestra que el enlace salio de un correo nuestro.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u");
  const token = url.searchParams.get("t");

  if (!userId || !token || token !== optOutToken(userId)) {
    return new NextResponse("Enlace no valido.", { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { statsEmailOptOut: true },
    });
  } catch {
    return new NextResponse("Enlace no valido.", { status: 400 });
  }

  return new NextResponse(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Baja confirmada</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f5f5;color:#171717;">
<div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;max-width:420px;text-align:center;">
<h1 style="font-size:18px;margin:0 0 8px;">Baja confirmada</h1>
<p style="font-size:14px;color:#525252;margin:0;">No volveras a recibir los informes de visitas de Destaco.es.</p>
</div></body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
