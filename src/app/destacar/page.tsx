import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Search,
  Star,
} from "lucide-react";

import { PrepaidCheckout } from "@/components/dashboard/billing-buttons";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getMyCompanies } from "@/lib/data/dashboard";
import { euro, FEATURED_TIERS } from "@/lib/plans";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Destaca tu empresa",
  description:
    "Oferta de lanzamiento: 50% de descuento. Aparece el primero en tu sector y convierte las búsquedas en clientes. Destacado Regional (tu provincia) por 4,17 €/mes o Nacional (toda España) por 8,33 €/mes, con facturación anual.",
  path: "/destacar",
  noindex: true,
});

const BENEFITS = [
  "Apareces el primero en tu categoría, por encima de tu competencia",
  "Insignia «Destacado» que transmite confianza y dispara tus clics",
  "Multiplicas tu visibilidad: más visitas, más llamadas y más clientes",
  "Adelantas a tu competencia y captas la demanda de tu sector",
  "Estadísticas avanzadas para medir tu retorno en tiempo real",
  "Soporte prioritario: te ayudamos a vender más",
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
        description="Tus clientes ya están buscando lo que ofreces. Aparece el primero en tu sector, gánate su confianza con la insignia «Destacado» y convierte esas búsquedas en clientes. Tú decides dónde destacar y cancelas cuando quieras."
        meta={
          <span className="flex flex-wrap items-center gap-1.5">
            <Star className="size-4" />
            <span className="text-success font-semibold">Oferta -50%</span> ·
            Desde {euro(FEATURED_TIERS.REGIONAL.monthly)}/mes · Nacional{" "}
            {euro(FEATURED_TIERS.NACIONAL.monthly)}/mes · facturado anualmente
          </span>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Pago directo: primero pagas, luego asignas la empresa */}
        <section>
          <div className="border-primary/40 bg-card ring-primary/10 rounded-2xl border p-6 shadow-sm ring-1 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Destácala ahora
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Elige el nivel y paga de forma segura en un minuto. Justo
                  después eliges a qué empresa aplicar el destacado: una que ya
                  tengas, una que reclames o una nueva.
                </p>
              </div>
              <span className="bg-success/15 text-success inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold">
                Oferta -50%
              </span>
            </div>
            <div className="mt-6">
              <PrepaidCheckout />
            </div>
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
                          <Star className="size-3" />
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
                Reclámala en segundos para verificar que es tuya y destácala con
                un par de clics. Empieza a recibir más clientes hoy mismo.
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
                Publícala gratis en un minuto y destácala para adelantar a tu
                competencia y aparecer el primero en tu sector.
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
                Todo lo que consigues al destacar
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Suscripción anual sin permanencia: cancela cuando quieras y
                empieza a destacar al instante.
              </p>
            </div>
            <div className="text-right">
              <div className="flex flex-wrap items-end justify-end gap-x-2">
                <span className="text-muted-foreground pb-1 text-sm">desde</span>
                <span className="text-3xl font-semibold tracking-tight">
                  {euro(FEATURED_TIERS.REGIONAL.monthly)}
                </span>
                <span className="text-muted-foreground pb-1 text-sm line-through">
                  {euro((FEATURED_TIERS.REGIONAL.base * 2) / 12)}
                </span>
                <span className="text-muted-foreground pb-1 text-sm">
                  / mes
                </span>
              </div>
              <p className="text-success text-xs font-semibold">
                Oferta de lanzamiento: 50% de descuento
              </p>
              <p className="text-muted-foreground text-xs">
                Facturado anualmente: {euro(FEATURED_TIERS.REGIONAL.base)} + IVA
                · Nacional {euro(FEATURED_TIERS.NACIONAL.monthly)}/mes
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
