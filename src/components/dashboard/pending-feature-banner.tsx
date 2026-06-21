import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

/**
 * Red de seguridad para el flujo pago-primero: si el usuario tiene un pago
 * "Destacado" recibido pero todavia sin asignar (PendingFeature en estado
 * PENDING cuyo email coincide con el suyo), le mostramos un aviso con enlace a
 * /destacar/completar para que lo asigne a una empresa. Si no hay nada pendiente
 * no renderiza nada.
 */
export async function PendingFeatureBanner({
  email,
}: {
  email?: string | null;
}) {
  if (!email) return null;

  const pending = await prisma.pendingFeature.findFirst({
    where: {
      status: "PENDING",
      email: { equals: email, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, stripeSessionId: true },
  });

  if (!pending) return null;

  const href = pending.stripeSessionId
    ? `/destacar/completar?session_id=${encodeURIComponent(pending.stripeSessionId)}`
    : `/destacar/completar?pending=${pending.id}`;

  return (
    <div className="border-primary/30 bg-primary/5 ring-primary/10 mb-6 flex flex-wrap items-center gap-3 rounded-xl border p-4 ring-1">
      <BadgeCheck className="text-primary size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          Tienes un pago de destacado sin asignar
        </p>
        <p className="text-muted-foreground text-sm">
          Ya hemos recibido tu pago. Solo falta elegir a qué empresa aplicar el
          destacado.
        </p>
      </div>
      <Button asChild variant="brand" size="sm">
        <Link href={href}>
          Asignar mi destacado
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
