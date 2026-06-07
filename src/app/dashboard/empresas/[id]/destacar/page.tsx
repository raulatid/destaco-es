import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check } from "lucide-react";

import {
  FeatureCheckout,
  PortalButton,
} from "@/components/dashboard/billing-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getCompanyBilling } from "@/lib/data/dashboard";
import { euro, FEATURED_TIERS, tierForScope } from "@/lib/plans";

const BENEFITS = [
  "Posicion destacada en tu categoria: a nivel regional o nacional",
  "Tu eliges el alcance: tu provincia (Regional) o toda España (Nacional)",
  "Insignia «Destacado» en tu perfil y en los listados",
  "Mas visibilidad, mas visitas y mas leads",
  "Estadisticas avanzadas de rendimiento",
  "Soporte prioritario",
];

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { dateStyle: "long" }) : null;

export default async function DestacarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { id } = await params;
  const { estado } = await searchParams;
  const session = await auth();
  if (!session?.user) notFound();

  const billing = await getCompanyBilling(session.user.id, id);
  if (!billing) notFound();

  const isActive =
    billing.featured &&
    (billing.subStatus === "ACTIVE" || billing.subStatus === "TRIALING");
  const isPastDue = billing.subStatus === "PAST_DUE";
  const renewsOn = formatDate(billing.currentPeriodEnd ?? billing.featuredUntil);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Destaca tu empresa
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Aparece por encima del resto en tu sector y consigue mas clientes con{" "}
            {billing.companyName}.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/empresas">
            <ArrowLeft className="size-4" />
            Mis empresas
          </Link>
        </Button>
      </div>

      {estado === "ok" && (
        <div className="border-success/30 bg-success/10 text-success mt-6 flex items-center gap-2 rounded-xl border p-4 text-sm">
          <BadgeCheck className="size-5 shrink-0" />
          <span>
            Pago recibido. Tu empresa se destacara en cuanto Stripe confirme la
            suscripcion (unos segundos).
          </span>
        </div>
      )}
      {estado === "cancelado" && (
        <div className="text-muted-foreground bg-muted/50 mt-6 rounded-xl border p-4 text-sm">
          Has cancelado el proceso de pago. Tu empresa sigue en el plan Gratis.
        </div>
      )}

      {isActive ? (
        <div className="bg-card mt-6 rounded-xl border p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              <BadgeCheck className="size-3" />
              Destacada
            </Badge>
            {billing.featuredScope && (
              <Badge variant="outline">
                {FEATURED_TIERS[tierForScope(billing.featuredScope)].name}
              </Badge>
            )}
            {renewsOn && (
              <span className="text-muted-foreground text-sm">
                Se renueva el {renewsOn}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm">
            Tu empresa esta <strong>destacada</strong>
            {billing.featuredScope
              ? ` (${FEATURED_TIERS[tierForScope(billing.featuredScope)].name})`
              : ""}
            . Desde el portal puedes actualizar tu metodo de pago, descargar tus
            facturas o cancelar la renovacion.
          </p>
          <div className="mt-5">
            <PortalButton companyId={billing.companyId} />
          </div>
        </div>
      ) : (
        <div className="bg-card mt-6 rounded-2xl border p-7">
          {isPastDue && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive mb-5 rounded-lg border p-3 text-sm">
              Tu ultimo pago no se ha podido cobrar. Actualiza tu metodo de pago
              para seguir destacando.
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Plan Destacado
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Suscripcion anual. Sin permanencia: puedes cancelar cuando
                quieras.
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-end gap-2">
                <span className="text-muted-foreground pb-1 text-sm">desde</span>
                <span className="text-3xl font-semibold tracking-tight">
                  {euro(FEATURED_TIERS.REGIONAL.base)}
                </span>
                <span className="text-muted-foreground pb-1 text-sm">
                  / año + IVA
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Nacional {euro(FEATURED_TIERS.NACIONAL.base)} / año + IVA · elige
                el nivel abajo
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-3 text-sm">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <Check className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7">
            {isPastDue && billing.hasSubscription ? (
              <PortalButton companyId={billing.companyId} />
            ) : (
              <FeatureCheckout
                companyId={billing.companyId}
                initialScope={billing.featuredScope}
              />
            )}
          </div>

          <p className="text-muted-foreground mt-4 text-xs">
            Pago seguro con tarjeta gestionado por Stripe. Recibiras una factura
            con IVA para tu contabilidad.
          </p>
        </div>
      )}
    </div>
  );
}
