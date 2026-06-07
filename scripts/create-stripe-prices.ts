/**
 * Crea (de forma idempotente) el precio del plan DESTACADO NACIONAL en Stripe:
 * 99,99 EUR/año (base, sin IVA — el 21% se anade en el checkout via el tax rate
 * STRIPE_TAX_RATE_ID, igual que el plan regional de 49,99 EUR).
 *
 * Es seguro ejecutarlo varias veces: si ya existe un precio con el lookup_key
 * "destaco_nacional_anual" (o si STRIPE_PRICE_ID_NACIONAL ya esta en el entorno)
 * lo reutiliza en lugar de crear otro. NUNCA imprime la clave secreta.
 *
 *   npm run stripe:prices
 *   # o: npx tsx scripts/create-stripe-prices.ts
 *
 * Despues, copia el Price ID que imprime en STRIPE_PRICE_ID_NACIONAL (.env y Vercel).
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env: usa las variables ya presentes en el entorno */
}

const LOOKUP_KEY = "destaco_nacional_anual";
const UNIT_AMOUNT = 9999; // 99,99 EUR en centimos (base, IVA aparte)
const CURRENCY = "eur";

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error(
      "\n  Falta STRIPE_SECRET_KEY. Anadela a tu .env (clave secreta de Stripe)\n" +
        "  y vuelve a ejecutar: npm run stripe:prices\n",
    );
    process.exit(1);
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret);

  // 0. Ya configurada en el entorno -> nada que hacer.
  if (process.env.STRIPE_PRICE_ID_NACIONAL) {
    console.log(
      "\n  STRIPE_PRICE_ID_NACIONAL ya esta configurada:",
      process.env.STRIPE_PRICE_ID_NACIONAL,
      "\n  (no se crea nada). Si quieres regenerarla, borra la variable y reejecuta.\n",
    );
    return;
  }

  // 1. ¿Existe ya un precio con nuestro lookup_key? -> reutilizar.
  const existing = await stripe.prices.list({
    lookup_keys: [LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) {
    printResult(existing.data[0].id, "reutilizado (ya existia)");
    return;
  }

  // 2. Crear producto + precio recurrente anual.
  const product = await stripe.products.create({
    name: "Destaco — Destacado Nacional",
    description:
      "Posicion destacada a nivel nacional (toda España) durante un año. Renovacion anual.",
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: CURRENCY,
    unit_amount: UNIT_AMOUNT,
    recurring: { interval: "year" },
    lookup_key: LOOKUP_KEY,
    nickname: "Destacado Nacional anual (base sin IVA)",
  });

  printResult(price.id, "creado");
}

function printResult(priceId: string, what: string) {
  console.log("\n  Plan Destacado Nacional " + what + ".");
  console.log("  Price ID:", priceId);
  console.log("\n  Anade esta linea a tu .env y a Vercel:");
  console.log("    STRIPE_PRICE_ID_NACIONAL=" + priceId + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n  Error al crear el precio en Stripe:\n", e);
    process.exit(1);
  });
