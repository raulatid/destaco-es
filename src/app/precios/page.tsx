import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { FaqSection } from "@/components/faq-section";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/lib/constants";
import { buildMetadata, faqJsonLd, pricingFaqs } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Precios: plan Gratis y plan Destacado",
  description:
    "Aparece gratis en el directorio de empresas de España o destaca por encima del resto en tu sector con el plan Destacado por 49,99 € al año.",
  path: "/precios",
});

const PLANS = [
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
    name: "Destacado",
    price: "49,99 €",
    oldPrice: "100 €",
    period: "al año + IVA",
    priceNote: "60,49 € IVA incluido (21%)",
    description: "Aparece por encima del resto y consigue mas clientes.",
    features: [
      "Todo lo incluido en el plan Gratis",
      "Posicion destacada en tu categoria, a nivel nacional, provincial o local",
      "Tu eliges donde destacar: toda España, tu provincia o tu ciudad",
      "Insignia «Destacado» en tu perfil y en los listados",
      "Mas visibilidad, mas visitas y mas leads",
      "Estadisticas avanzadas de rendimiento",
      "Soporte prioritario",
    ],
    cta: "Destacar mi empresa",
    href: "/destacar",
    featured: true,
  },
] as const;

export default function PreciosPage() {
  const faqs = pricingFaqs();

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />

      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Precios" }]}
        title="Planes y precios"
        description="Empieza gratis y, cuando quieras, destaca tu empresa por encima del resto en tu sector para conseguir mas trafico, leads y autoridad."
        meta={
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4" />
            Oferta de lanzamiento: 49,99 €/año + IVA (60,49 € IVA incl., antes
            100 €)
          </span>
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-2">
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
                <span className="bg-primary text-primary-foreground absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
                  <Sparkles className="size-3" />
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
                {"oldPrice" in plan && plan.oldPrice && (
                  <span className="text-muted-foreground pb-1 text-sm line-through">
                    {plan.oldPrice}
                  </span>
                )}
              </div>
              {"priceNote" in plan && plan.priceNote && (
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
