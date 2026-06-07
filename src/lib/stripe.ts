import Stripe from "stripe";

import { FEATURED_TIERS, type FeaturedTier } from "./plans";

/**
 * Cliente Stripe perezoso (lazy). No se instancia en build ni si falta la clave;
 * solo al primer uso real (checkout, portal, webhook). Asi el proyecto compila y
 * arranca aunque Stripe no este configurado todavia.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY no esta configurada.");
    }
    client = new Stripe(key);
  }
  return client;
}

/** El plan de pago "Destacado" mapea al plan PRO de la base de datos. */
export const FEATURED_PLAN = "PRO" as const;

/**
 * Precio de referencia (nivel regional, el de entrada). Para precios por nivel
 * usa FEATURED_TIERS de `@/lib/plans`. Solo para mostrar; el cobro lo fija Stripe.
 */
export const FEATURED_PRICE = {
  base: FEATURED_TIERS.REGIONAL.base,
  vatRate: 0.21,
  total: FEATURED_TIERS.REGIONAL.total,
} as const;

/**
 * Devuelve el Price ID de Stripe para un nivel, leyendo la variable de entorno
 * correspondiente. Devuelve undefined si ese nivel no esta configurado todavia.
 */
export function priceIdForTier(tier: FeaturedTier): string | undefined {
  const envKey = FEATURED_TIERS[tier].priceEnv;
  return process.env[envKey] || undefined;
}
