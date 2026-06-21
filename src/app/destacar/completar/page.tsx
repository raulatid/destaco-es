import type { Metadata } from "next";
import Link from "next/link";
import type { FeaturedScope } from "@prisma/client";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Plus,
  Search,
} from "lucide-react";

import { assignPendingFeature } from "@/lib/actions/billing";
import { auth } from "@/lib/auth";
import { LEGAL } from "@/lib/constants";
import { getMyCompanies } from "@/lib/data/dashboard";
import { euro, FEATURED_TIERS, isFeaturedTier } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { getStripe } from "@/lib/stripe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Completa tu destacado",
  description: "Asigna tu pago a una empresa para activar el destacado.",
  path: "/destacar/completar",
  noindex: true,
});

type PendingRow = {
  id: string;
  email: string;
  tier: string;
  featuredScope: FeaturedScope | null;
  stripeSubscriptionId: string | null;
  stripeSessionId: string | null;
  currentPeriodEnd: Date | null;
  status: string;
  claimedCompanyId: string | null;
};

/** Resuelve el pago pendiente por id, o por session_id (con respaldo en Stripe). */
async function resolvePending(
  pendingId?: string,
  sessionId?: string,
): Promise<PendingRow | null> {
  if (pendingId) {
    return prisma.pendingFeature.findUnique({ where: { id: pendingId } });
  }
  if (!sessionId) return null;

  const found = await prisma.pendingFeature.findUnique({
    where: { stripeSessionId: sessionId },
  });
  if (found) return found;

  // El webhook puede tardar unos segundos: lo reconstruimos desde Stripe.
  try {
    const stripe = getStripe();
    const cs = await stripe.checkout.sessions.retrieve(sessionId);
    if (!cs.subscription) return null;
    const subId =
      typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id;
    const sub = await stripe.subscriptions.retrieve(subId);

    const tier = sub.metadata?.tier === "NACIONAL" ? "NACIONAL" : "REGIONAL";
    const scopeRaw = sub.metadata?.featuredScope;
    const featuredScope: FeaturedScope | undefined =
      scopeRaw === "NACIONAL" ||
      scopeRaw === "PROVINCIAL" ||
      scopeRaw === "LOCAL"
        ? scopeRaw
        : undefined;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const item = sub.items?.data?.[0] as
      | { current_period_end?: number }
      | undefined;
    const periodEnd = item?.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null;
    const email = cs.customer_details?.email ?? cs.customer_email ?? "";

    return prisma.pendingFeature.upsert({
      where: { stripeSubscriptionId: sub.id },
      create: {
        email,
        tier,
        featuredScope,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        stripeSessionId: sessionId,
        currentPeriodEnd: periodEnd,
        status: "PENDING",
      },
      update: {
        stripeSessionId: sessionId,
        ...(email ? { email } : {}),
      },
    });
  } catch (error) {
    console.error("[completar] no se pudo recuperar el pago de Stripe:", error);
    return null;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">{children}</div>
  );
}

export default async function CompletarPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; pending?: string; error?: string }>;
}) {
  const { session_id, pending: pendingParam, error } = await searchParams;

  const pending = await resolvePending(pendingParam, session_id);

  // 1) No encontramos el pago todavia.
  if (!pending) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">
          Estamos confirmando tu pago
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Si acabas de pagar, espera unos segundos y recarga esta página. Si el
          problema continúa, escríbenos a{" "}
          <a className="text-foreground font-medium" href={`mailto:${LEGAL.email}`}>
            {LEGAL.email}
          </a>{" "}
          y lo resolvemos enseguida.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/destacar">Volver a Destacar</Link>
        </Button>
      </Shell>
    );
  }

  const backHref = pending.stripeSessionId
    ? `/destacar/completar?session_id=${encodeURIComponent(pending.stripeSessionId)}`
    : `/destacar/completar?pending=${pending.id}`;

  const tierKey = isFeaturedTier(pending.tier) ? pending.tier : "REGIONAL";
  const tierCfg = FEATURED_TIERS[tierKey];

  // 2) Pago cancelado.
  if (pending.status === "CANCELED") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">
          Este pago ya no está activo
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          La suscripción asociada a este pago se canceló. Puedes volver a
          destacar tu empresa cuando quieras.
        </p>
        <Button asChild variant="brand" className="mt-6">
          <Link href="/destacar">
            Destacar mi empresa
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </Shell>
    );
  }

  // 3) Ya asignado.
  if (pending.status === "CLAIMED") {
    return (
      <Shell>
        <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-xl border p-4 text-sm">
          <BadgeCheck className="size-5 shrink-0" />
          <span>Este pago ya está asignado y tu empresa está destacada.</span>
        </div>
        <Button asChild variant="brand" className="mt-6">
          <Link
            href={
              pending.claimedCompanyId
                ? `/dashboard/empresas/${pending.claimedCompanyId}/destacar`
                : "/dashboard/empresas"
            }
          >
            Ir a mi panel
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </Shell>
    );
  }

  const session = await auth();

  const PaidBanner = (
    <div className="border-success/30 bg-success/10 text-success flex items-start gap-2 rounded-xl border p-4 text-sm">
      <BadgeCheck className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-medium">¡Pago recibido! Gracias.</p>
        <p className="text-success/90 mt-0.5">
          Has contratado el plan <strong>{tierCfg.name}</strong> ({euro(tierCfg.total)}{" "}
          IVA incluido / año). Solo falta asignarlo a tu empresa.
        </p>
      </div>
    </div>
  );

  // 4) Sin sesión: registrarse o iniciar sesión para asignar el pago.
  if (!session?.user) {
    const cb = encodeURIComponent(backHref);
    return (
      <Shell>
        {PaidBanner}
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Crea tu cuenta para activar el destacado
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Inicia sesión o crea una cuenta gratis para asignar este pago a tu
          empresa. Te recomendamos usar el mismo correo del pago
          {pending.email ? (
            <>
              {" "}
              (<strong>{pending.email}</strong>)
            </>
          ) : null}
          .
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="brand" size="lg">
            <Link href={`/registro?callbackUrl=${cb}`}>
              Crear cuenta gratis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/login?callbackUrl=${cb}`}>Ya tengo cuenta</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-6 text-xs">
          Tu pago está guardado de forma segura. Podrás asignarlo en cuanto
          inicies sesión.
        </p>
      </Shell>
    );
  }

  // 5) Con sesión: elegir empresa.
  const companies = await getMyCompanies(session.user.id);

  return (
    <Shell>
      {PaidBanner}

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        ¿A qué empresa aplicamos el destacado?
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Plan <strong>{tierCfg.name}</strong>. Elige una de tus empresas o añade
        una nueva.
      </p>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mt-5 rounded-lg border p-3 text-sm">
          {error === "empresa"
            ? "No pudimos verificar que esa empresa es tuya. Inténtalo de nuevo."
            : error === "pago"
              ? "Este pago ya no está disponible para asignar."
              : "No se pudo asignar el destacado. Inténtalo de nuevo en unos segundos."}
        </div>
      )}

      {companies.length > 0 && (
        <div className="mt-6 space-y-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{company.name}</p>
                  {company.featured && (
                    <Badge variant="success">
                      <BadgeCheck className="size-3" />
                      Ya destacada
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {company.category}
                  {company.city ? ` · ${company.city}` : ""}
                </p>
              </div>
              <form
                action={assignPendingFeature.bind(
                  null,
                  pending.id,
                  company.id,
                  backHref,
                )}
              >
                <Button type="submit" variant="brand" size="sm">
                  Destacar esta
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold tracking-tight">
          {companies.length > 0
            ? "¿Tu empresa no está en la lista?"
            : "Aún no tienes empresas"}
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="bg-card flex flex-col rounded-2xl border p-5">
            <Building2 className="text-primary size-5" />
            <h3 className="mt-3 text-sm font-semibold">Publica una empresa</h3>
            <p className="text-muted-foreground mt-1 flex-1 text-sm">
              Créala gratis en un minuto y vuelve aquí para asignarle el
              destacado.
            </p>
            <Button asChild variant="brand" size="sm" className="mt-4">
              <Link href="/dashboard/empresas/nueva">
                <Plus className="size-4" />
                Publicar empresa
              </Link>
            </Button>
          </div>
          <div className="bg-card flex flex-col rounded-2xl border p-5">
            <Search className="text-primary size-5" />
            <h3 className="mt-3 text-sm font-semibold">Reclama la tuya</h3>
            <p className="text-muted-foreground mt-1 flex-1 text-sm">
              Si ya aparece en Destaco, reclámala para verificar que es tuya y
              vuelve aquí para destacarla.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/empresas">Buscar mi empresa</Link>
            </Button>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mt-8 text-xs">
        Si necesitas ayuda, escríbenos a{" "}
        <a className="text-foreground font-medium" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>
        .
      </p>
    </Shell>
  );
}
