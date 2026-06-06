import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Indica si el usuario autenticado tiene al menos una empresa destacada.
 * Lo consulta el header para decidir si mostrar el CTA "Destaca tu empresa"
 * (se oculta cuando el usuario ya tiene una empresa destacada). Mantener el
 * header como client component permite que el resto de paginas sigan siendo
 * estaticas/ISR.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ hasFeatured: false });
  }
  try {
    const company = await prisma.company.findFirst({
      where: { ownerId: session.user.id, featured: true },
      select: { id: true },
    });
    return NextResponse.json({ hasFeatured: Boolean(company) });
  } catch {
    return NextResponse.json({ hasFeatured: false });
  }
}
