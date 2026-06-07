import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getMyCompanies } from "@/lib/data/dashboard";
import { euro, FEATURED_TIER_ORDER, FEATURED_TIERS } from "@/lib/plans";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Destaca tu empresa",
  description:
    "Aparece por encima del resto en tu categoria. Elige tu nivel: Regional (tu provincia) por 49,99 €/año o Nacional (toda España) por 99,99 €/año.",
  path: "/destacar",
  noindex: true,
});

const BENEFITS = [
  "Posicion destacada en tu categoria",
  "Insignia «Destacado» en tu perfil y en los listados",
  "Mas visibilidad, mas visitas y mas leads",
  "Estadisticas avanzadas de rendimiento",
  "Soporte prioritario",
];

export default async function DestacarPage() {
  const session = await auth();
  const companies = session?.user
    ? await getMyCompanies(session.user.id)
    : [];

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Destaca tu empresa" }]}
        title="Destaca tu empresa"
        description="Aparece por encima del resto en tu sector y consigue mas clientes. Tu eliges donde destacar y solo pagas si quieres mas visibilidad."
        meta={
          <span className="flex items-center gap-1.5">
            <Star className="size-4" />
            Desde {euro(FEATURED_TIERS.REGIONAL.base)} / año + IVA · Nacional{" "}
            {euro(FEATURED_TIERS.NACIONAL.base)} / año
          </span>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Niveles */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            Elige tu nivel
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Mismo plan, dos alcances. Eliges el nivel al contratar, segun donde
            estan tus clientes.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FEATURED_TIER_ORDER.map((id) => {
              const t = FEATURED_TIERS[id];
              return (
                <div
                  key={id}
                  className={cn(
                    "bg-card rounded-xl border p-5",
                    t.recommended && "border-primary ring-primary/20 ring-1",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{t.name}</p>
                    {t.recommended && (
                      <Badge variant="success">
                        <Sparkles className="size-3" />
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3">
                    <span className="text-2xl font-semibold tracking-tight">
                      {euro(t.base)}
                    </span>{" "}
                    <span className="text-muted-foreground text-sm">
                      / año + IVA
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {euro(t.total)} IVA incluido (21%)
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {t.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Empresas del usuario (si ha iniciado sesion) */}
        {session?.user && companies.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">
              Destacar una de tus empresas
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Selecciona la empresa que quieres destacar.
            </p>
            <div className="mt-5 space-y-3">
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
                          <Sparkles className="size-3" />
                          Destacada
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {company.category}
                      {company.city ? ` · ${company.city}` : ""}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant={company.featured ? "outline" : "brand"}
                  >
                    <Link href={`/dashboard/empresas/${company.id}/destacar`}>
                      {company.featured ? "Gestionar" : "Destacar"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chooser: ya esta en Destaco o no */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            {session?.user
              ? "¿Tu empresa no esta en la lista?"
              : "¿Tu empresa ya esta en Destaco?"}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Ya esta en Destaco */}
            <div className="bg-card flex flex-col rounded-2xl border p-6">
              <Search className="text-primary size-5" />
              <h3 className="mt-3 font-semibold">Si, ya aparece en Destaco</h3>
              <p className="text-muted-foreground mt-1 flex-1 text-sm">
                Reclama tu ficha para verificar que es tuya y despues destacala
                en un par de clics.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-5 w-full"
              >
                <Link
                  href={
                    session?.user
                      ? "/empresas"
                      : "/login?callbackUrl=%2Fdestacar"
                  }
                >
                  {session?.user
                    ? "Buscar y reclamar mi empresa"
                    : "Iniciar sesion"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {/* No esta todavia */}
            <div className="border-primary bg-card ring-primary/20 flex flex-col rounded-2xl border p-6 ring-1">
              <Building2 className="text-primary size-5" />
              <h3 className="mt-3 font-semibold">No, aun no aparece</h3>
              <p className="text-muted-foreground mt-1 flex-1 text-sm">
                Publica tu empresa gratis en un minuto y destacala despues para
                aparecer por encima del resto.
              </p>
              <Button asChild variant="brand" className="mt-5 w-full">
                <Link
                  href={
                    session?.user
                      ? "/dashboard/empresas/nueva"
                      : "/registro?callbackUrl=%2Fdashboard%2Fempresas%2Fnueva"
                  }
                >
                  Publicar mi empresa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="bg-card mt-10 rounded-2xl border p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Que incluye el plan Destacado
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Suscripcion anual. Sin permanencia: cancela cuando quieras.
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
                Nacional {euro(FEATURED_TIERS.NACIONAL.base)} / año + IVA
              </p>
            </div>
          </div>
          <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <Check className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Pago seguro con tarjeta gestionado por Stripe. Recibiras una factura
          con IVA para tu contabilidad.
        </p>
      </div>
    </>
  );
}
