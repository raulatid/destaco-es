"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { FEATURED_TIERS, isFeaturedTier, type FeaturedTier } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getStripe, priceIdForTier } from "@/lib/stripe";

export type BillingState = { error?: string };

/** Normaliza el nivel recibido del formulario (por defecto, regional). */
function parseTier(raw: FormDataEntryValue | null): FeaturedTier {
  const value = typeof raw === "string" ? raw.toUpperCase() : "";
  return isFeaturedTier(value) ? value : "REGIONAL";
}

/** Comprueba que el usuario es propietario de la empresa y trae su suscripcion. */
async function getOwnedCompany(companyId: string, userId: string) {
  return prisma.company.findFirst({
    where: { id: companyId, ownerId: userId },
    select: {
      id: true,
      name: true,
      slug: true,
      subscription: { select: { stripeCustomerId: true } },
      owner: { select: { email: true } },
    },
  });
}

/**
 * Inicia el pago del plan Destacado (suscripcion anual recurrente).
 * Aplica el 21% de IVA via tax_rate y recoge el NIF/CIF del cliente para la
 * factura. Redirige a Stripe Checkout. Devuelve { error } solo si falla antes.
 */
export async function startCheckout(
  companyId: string,
  _prev: BillingState,
  formData: FormData,
): Promise<BillingState> {
  const session = await auth();
  if (!session?.user) return { error: "Inicia sesion para destacar tu empresa." };

  const company = await getOwnedCompany(companyId, session.user.id);
  if (!company) return { error: "No tienes permisos sobre esta empresa." };

  const tier = parseTier(formData.get("tier"));
  const scope = FEATURED_TIERS[tier].scope;

  const priceId = priceIdForTier(tier);
  if (!priceId) {
    return {
      error:
        tier === "NACIONAL"
          ? "El plan nacional aun no esta disponible. Prueba con el plan regional o vuelve mas tarde."
          : "La pasarela de pago no esta configurada todavia.",
    };
  }
  const taxRateId = process.env.STRIPE_TAX_RATE_ID;

  // Guardamos el alcance elegido (la empresa se marca como destacada cuando el
  // webhook de Stripe confirme el pago).
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { featuredScope: scope },
    });
  } catch (error) {
    console.error("[billing] no se pudo guardar el alcance:", error);
  }

  const baseUrl = SITE.url;
  const successUrl = `${baseUrl}/dashboard/empresas/${companyId}/destacar?estado=ok`;
  const cancelUrl = `${baseUrl}/dashboard/empresas/${companyId}/destacar?estado=cancelado`;

  let checkoutUrl: string | null = null;
  try {
    const stripe = getStripe();
    const existingCustomer = company.subscription?.stripeCustomerId ?? undefined;

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Forzamos tarjeta como metodo de pago. Sin esto, Stripe usa los metodos
      // "automaticos" configurados en el dashboard; si la cuenta no tiene
      // ninguno activado para EUR, devuelve "No valid payment method types for
      // this Checkout Session" y el checkout no llega a abrirse.
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
          ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
        },
      ],
      // Cliente existente -> reutiliza y actualiza sus datos; nuevo -> Stripe lo crea.
      ...(existingCustomer
        ? {
            customer: existingCustomer,
            customer_update: { address: "auto", name: "auto" },
          }
        : {
            customer_email:
              company.owner?.email ?? session.user.email ?? undefined,
          }),
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
      client_reference_id: companyId,
      metadata: { companyId, featuredScope: scope, tier },
      subscription_data: { metadata: { companyId, featuredScope: scope, tier } },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    checkoutUrl = checkout.url;
  } catch (error) {
    console.error("[stripe] error al crear checkout:", error);
    return { error: "No se pudo iniciar el pago. Intentalo de nuevo en unos minutos." };
  }

  if (!checkoutUrl) return { error: "No se pudo iniciar el pago." };
  redirect(checkoutUrl);
}

/**
 * Abre el portal de cliente de Stripe para gestionar la suscripcion, el metodo
 * de pago y descargar las facturas.
 */
export async function openBillingPortal(
  companyId: string,
  _prev: BillingState,
  _formData: FormData,
): Promise<BillingState> {
  const session = await auth();
  if (!session?.user) return { error: "Inicia sesion." };

  const company = await getOwnedCompany(companyId, session.user.id);
  if (!company) return { error: "No tienes permisos sobre esta empresa." };

  const customerId = company.subscription?.stripeCustomerId;
  if (!customerId) return { error: "Aun no tienes una suscripcion activa." };

  let portalUrl: string | null = null;
  try {
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE.url}/dashboard/empresas/${companyId}/destacar`,
    });
    portalUrl = portal.url;
  } catch (error) {
    console.error("[stripe] error al abrir el portal:", error);
    return { error: "No se pudo abrir el portal de facturacion." };
  }

  redirect(portalUrl);
}
