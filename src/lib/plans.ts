import type { FeaturedScope } from "@prisma/client";

/**
 * Niveles del plan Destacado. Este modulo es "client-safe" (no importa el SDK de
 * Stripe ni nada de servidor) para poder usarse tanto en componentes de cliente
 * como en el servidor. La resolucion del Price ID real de Stripe vive en
 * `@/lib/stripe` (priceIdForTier), que solo se usa en el servidor.
 *
 *  - REGIONAL (49,99 €/año): posiciona en tu nicho a nivel regional (tu provincia).
 *  - NACIONAL (99,99 €/año): maxima visibilidad, destaca en toda España.
 */
export type FeaturedTier = "REGIONAL" | "NACIONAL";

export interface FeaturedTierConfig {
  id: FeaturedTier;
  /** Alcance que se guarda en Company.featuredScope al contratar este nivel. */
  scope: FeaturedScope;
  name: string;
  tagline: string;
  /** Precio sin IVA (lo que se muestra como referencia). */
  base: number;
  /** Precio con IVA del 21% incluido. */
  total: number;
  /** Equivalente mensual (base/12). SOLO informativo: el cobro es ANUAL. */
  monthly: number;
  /** Variable de entorno con el Price ID de Stripe para este nivel. */
  priceEnv: "STRIPE_PRICE_ID" | "STRIPE_PRICE_ID_NACIONAL";
  /** Resaltar como recomendado en la UI. */
  recommended: boolean;
}

const VAT_RATE = 0.21;
const withVat = (base: number) => Math.round(base * (1 + VAT_RATE) * 100) / 100;

export const FEATURED_TIERS: Record<FeaturedTier, FeaturedTierConfig> = {
  REGIONAL: {
    id: "REGIONAL",
    scope: "PROVINCIAL",
    name: "Destacado Regional",
    tagline:
      "Lidera tu sector en tu provincia: aparece el primero allí donde te buscan tus clientes.",
    base: 49.99,
    total: withVat(49.99), // 60,49 €
    monthly: 49.99 / 12, // ~4,17 €/mes (facturado anualmente)
    priceEnv: "STRIPE_PRICE_ID",
    recommended: false,
  },
  NACIONAL: {
    id: "NACIONAL",
    scope: "NACIONAL",
    name: "Destacado Nacional",
    tagline:
      "Máxima visibilidad: domina tu sector en toda España y deja atrás a la competencia.",
    base: 99.99,
    total: withVat(99.99), // 120,99 €
    monthly: 99.99 / 12, // ~8,33 €/mes (facturado anualmente)
    priceEnv: "STRIPE_PRICE_ID_NACIONAL",
    recommended: true,
  },
};

/** Orden de los niveles para selectores y tablas de precios. */
export const FEATURED_TIER_ORDER: FeaturedTier[] = ["REGIONAL", "NACIONAL"];

/** Mapea el alcance guardado de una empresa a su nivel de plan. */
export function tierForScope(scope: FeaturedScope | null | undefined): FeaturedTier {
  return scope === "NACIONAL" ? "NACIONAL" : "REGIONAL";
}

/** Type guard para validar el nivel recibido de un formulario. */
export function isFeaturedTier(value: string): value is FeaturedTier {
  return value === "REGIONAL" || value === "NACIONAL";
}

/** Formatea un importe en euros con el formato español. */
export function euro(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}
