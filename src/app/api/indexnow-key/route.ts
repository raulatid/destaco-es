import { NextResponse } from "next/server";

import { indexNowKey } from "@/lib/seo/indexnow";

/**
 * Publica la clave de IndexNow en texto plano. IndexNow consulta esta URL
 * (keyLocation) para verificar que somos los duenos del dominio antes de
 * aceptar las notificaciones de URLs.
 */
export function GET() {
  const key = indexNowKey();
  if (!key) {
    return new NextResponse("IndexNow no configurado", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
