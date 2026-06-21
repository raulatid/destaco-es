import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { FaqSection } from "@/components/faq-section";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/lib/constants";
import { euro, FEATURED_TIERS } from "@/lib/plans";
import { buildMetadata, faqJsonLd, pricingFaqs } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Precios: plan Gratis, Destacado Regional y Nacional",
  description:
    "Aparece gratis en el directorio de empresas de España o destaca por encima del resto: plan Regional por 49,99 €/año (tu provincia) o Nacional por 99,99 €/año (toda España).",
  path: "/precios",
});

type Plan = {
  name: string;
  price: string;
  oldPrice?: string;
  period: string;
  priceNote?: string;
  description: string;
  features: readonly string[];
  cta: string;
  href: string;
  featured: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Gratis",
    price: "0 €",
    period: "para siempre",
    description: "Todo lo necesario para aparecer en el directorio.",
    features: [
      "Perfil de empresa en el directorio",
      "Apareces en busquedas por categoria y ciudad",
      "Reclama y verifica tu perfil",
      "Responde a las reseñas de tus clientes",
      "Sube tus servicios y proyectos",
      "Estadisticas basicas de tu perfil",
    ],
    cta: "Empezar gratis",
    href: "/registro",
    featured: false,
  },
  {
    name: "Destacado Regional",
    price: euro(FEATURED_TIERS.REGIONAL.base),
    period: "al año + IVA",
    priceNote: `${euro(FEATURED_TIERS.REGIONAL.total)} IVA incluido (21%)`,
    description: "Lidera tu sector en tu provincia y llena tu agenda de clientes cercanos.",
    features: [
      "Todo lo del plan Gratis",
      "Apareces el primero en tu categoría en toda tu provincia",
      "Insignia «Destacado» que transmite confianza y dispara tus clics",
      "Multiplicas tus visitas, llamadas y clientes",
      "Estadísticas avanzadas de rendimiento",
      "Soporte prioritario",
    ],
    cta: "Destacar a nivel regional",
    href: "/destacar",
    featured: false,
  },
  {
    name: "Destacado Nacional",
    price: euro(FEATURED_TIERS.NACIONAL.base),
    period: "al año + IVA",
    priceNote: `${euro(FEATURED_TIERS.NACIONAL.total)} IVA incluido (21%)`,
    description: "Máxima visibilidad: domina tu sector en toda España y deja atrás a la competencia.",
    features: [
      "Todo lo del plan Regional",
      "Apareces el primero en tu sector en toda España",
      "Máxima visibilidad en todo el país, por encima de tu competencia",
      "Insignia «Destacado» en tu perfil y en los listados",
      "Estadísticas avanzadas de rendimiento",
      "Soporte prioritario",
    ],
    cta: "Destacar a nivel nacional",
    href: "/destacar",
    featured: true,
  },
];

export default function PreciosPage() {
  const faqs = pricingFaqs();

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />

      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Precios" }]}
        title="Planes y precios"
        description="Empieza gratis y, cuando quieras, destaca tu empresa para aparecer el primero en tu sector, adelantar a tu competencia y convertir las búsquedas en clientes."
        meta={
          <span>
            Destaca desde {euro(FEATURED_TIERS.REGIONAL.base)}/año + IVA
            (regional) o {euro(FEATURED_TIERS.NACIONAL.base)}/año (nacional)
          </span>
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-7",
                plan.featured
                  ? "border-primary bg-card shadow-md ring-primary/20 ring-1"
                  : "bg-card",
              )}
            >
              {plan.featured && (
                <span className="bg-primary text-primary-foreground absolute -top-3 left-7 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold">
                  Recomendado
                </span>
              )}

              <h2 className="text-lg font-semibold tracking-tight">
                {plan.name}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {plan.description}
              </p>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-muted-foreground pb-1 text-sm">
                  {plan.period}
                </span>
                {plan.oldPrice && (
                  <span className="text-muted-foreground pb-1 text-sm line-through">
                    {plan.oldPrice}
                  </span>
                )}
              </div>
              {plan.priceNote && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {plan.priceNote}
                </p>
              )}

              <Button
                asChild
                variant={plan.featured ? "brand" : "outline"}
                size="lg"
                className="mt-6 w-full"
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <ul className="mt-7 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Pago seguro con tarjeta gestionado por Stripe. Precio con IVA (21%)
          incluido. Facturas emitidas por {LEGAL.ownerName} (autonomo, NIF{" "}
          {LEGAL.nif}).
        </p>

        <FaqSection
          faqs={faqs}
          title="Preguntas frecuentes sobre los planes"
          className="mx-auto mt-16"
        />
      </div>
    </>
  );
}
