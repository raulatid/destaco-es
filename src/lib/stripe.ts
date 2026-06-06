import Stripe from "stripe";

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

/** Precio del plan Destacado (solo para mostrar; el cobro real lo fija Stripe). */
export const FEATURED_PRICE = {
  base: 49.99,
  vatRate: 0.21,
  /** 49,99 € + 21% IVA = 60,49 € que paga el cliente. */
  total: 60.49,
} as const;
