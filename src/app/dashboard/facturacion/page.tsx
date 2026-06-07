import Link from "next/link";
import { CreditCard, Sparkles } from "lucide-react";

import { PortalButton } from "@/components/dashboard/billing-buttons";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getMyBilling } from "@/lib/data/dashboard";
import { euro, FEATURED_TIERS, tierForScope } from "@/lib/plans";

export const metadata = {
  title: "Facturacion",
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { dateStyle: "long" }) : null;

export default async function FacturacionPage() {
  const session = await auth();
  const billing = session?.user ? await getMyBilling(session.user.id) : [];

  const featuredCount = billing.filter((b) => b.featured).length;

  return (
    <div className="max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Facturacion</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gestiona el plan de cada empresa, tu metodo de pago y descarga tus
          facturas con IVA.
        </p>
      </div>

      {billing.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CreditCard}
            title="Aun no tienes facturacion"
            description="Publica una empresa y destacala para empezar a gestionar tu suscripcion y tus facturas."
          />
        </div>
      ) : (
        <>
          <div className="bg-card mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5">
            <div>
              <p className="text-sm font-medium">
                {featuredCount > 0
                  ? `${featuredCount} ${featuredCount === 1 ? "empresa destacada" : "empresas destacadas"}`
                  : "Ninguna empresa destacada"}
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Plan Destacado: Regional {euro(FEATURED_TIERS.REGIONAL.base)} ·
                Nacional {euro(FEATURED_TIERS.NACIONAL.base)} / año + IVA.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/precios">Ver planes</Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {billing.map((b) => {
              const isActive =
                b.featured &&
                (b.subStatus === "ACTIVE" || b.subStatus === "TRIALING");
              const isPastDue = b.subStatus === "PAST_DUE";
              const renewsOn = formatDate(b.currentPeriodEnd ?? b.featuredUntil);

              return (
                <div
                  key={b.companyId}
                  className="bg-card rounded-xl border p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{b.companyName}</p>
                        {isActive ? (
                          <Badge variant="success">
                            <Sparkles className="size-3" />
                            Destacada
                          </Badge>
                        ) : (
                          <Badge variant="muted">Plan Gratis</Badge>
                        )}
                        {isPastDue && (
                          <Badge variant="outline">Pago pendiente</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {isActive
                          ? renewsOn
                            ? `Suscripcion activa · se renueva el ${renewsOn}`
                            : "Suscripcion activa"
                          : isPastDue
                            ? "No hemos podido cobrar tu ultimo pago. Actualiza tu metodo de pago."
                            : "Destacala para aparecer por encima del resto en tu categoria."}
                      </p>
                      {isActive && b.featuredScope && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {FEATURED_TIERS[tierForScope(b.featuredScope)].name} ·{" "}
                          {euro(FEATURED_TIERS[tierForScope(b.featuredScope)].base)}{" "}
                          / año + IVA
                        </p>
                      )}
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/empresas/${b.companyId}/destacar`}>
                        Detalles
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-4">
                    {b.hasSubscription ? (
                      <PortalButton companyId={b.companyId} />
                    ) : (
                      <Button asChild variant="brand">
                        <Link
                          href={`/dashboard/empresas/${b.companyId}/destacar`}
                        >
                          <Sparkles className="size-4" />
                          Destacar mi empresa
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-5 text-xs">
            Los pagos y las facturas se gestionan de forma segura con Stripe.
            Desde «Gestionar suscripcion y facturas» puedes actualizar tu tarjeta,
            descargar facturas o cancelar la renovacion.
          </p>
        </>
      )}
    </div>
  );
}
