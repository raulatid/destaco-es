"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { FEATURED_TIERS, isFeaturedTier, type FeaturedTier } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { FEATURED_PLAN, getStripe, priceIdForTier } from "@/lib/stripe";

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

/**
 * Flujo PAGO-PRIMERO: inicia el pago del plan Destacado SIN exigir login ni tener
 * una empresa. El cobro se hace ya en Stripe; el webhook crea un PendingFeature y
 * el cliente lo asigna despues a una empresa suya en /destacar/completar.
 *
 * No lleva companyId: por eso la metadata incluye `kind: "prepaid"`, que el webhook
 * usa para distinguir este flujo del de una empresa concreta.
 */
export async function startPrepaidCheckout(
  _prev: BillingState,
  formData: FormData,
): Promise<BillingState> {
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

  // Si ya hay sesion, prerellenamos el email para acelerar el checkout.
  const session = await auth();
  const prefillEmail = session?.user?.email ?? undefined;

  const baseUrl = SITE.url;
  const successUrl = `${baseUrl}/destacar/completar?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/destacar?estado=cancelado`;

  let checkoutUrl: string | null = null;
  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
          ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
        },
      ],
      ...(prefillEmail ? { customer_email: prefillEmail } : {}),
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
      metadata: { kind: "prepaid", featuredScope: scope, tier },
      subscription_data: {
        metadata: { kind: "prepaid", featuredScope: scope, tier },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    checkoutUrl = checkout.url;
  } catch (error) {
    console.error("[stripe] error al crear checkout (prepaid):", error);
    return {
      error: "No se pudo iniciar el pago. Intentalo de nuevo en unos minutos.",
    };
  }

  if (!checkoutUrl) return { error: "No se pudo iniciar el pago." };
  redirect(checkoutUrl);
}

/**
 * Asigna un pago "Destacado" ya realizado (PendingFeature) a una empresa del
 * usuario. Crea la suscripcion real, marca la empresa como destacada y reescribe
 * la metadata de la suscripcion de Stripe con el companyId para que las
 * renovaciones se sincronicen por el webhook normal.
 *
 * `backHref` es la URL de /destacar/completar a la que volver si algo falla.
 */
export async function assignPendingFeature(
  pendingId: string,
  companyId: string,
  backHref: string,
  _formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(backHref)}`);
  }

  const pending = await prisma.pendingFeature.findUnique({
    where: { id: pendingId },
  });
  const subId = pending?.stripeSubscriptionId ?? null;
  if (!pending || pending.status !== "PENDING" || !subId) {
    redirect(`${backHref}&error=pago`);
  }

  const company = await prisma.company.findFirst({
    where: { id: companyId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!company) {
    redirect(`${backHref}&error=empresa`);
  }

  const featuredScope = pending.featuredScope ?? undefined;

  let ok = false;
  try {
    const stripe = getStripe();
    // Reasigna la suscripcion a la empresa (renovaciones via webhook normal).
    await stripe.subscriptions.update(subId, {
      metadata: {
        companyId,
        tier: pending.tier,
        ...(featuredScope ? { featuredScope } : {}),
        kind: "prepaid-claimed",
      },
    });

    await prisma.subscription.upsert({
      where: { companyId },
      create: {
        companyId,
        plan: FEATURED_PLAN,
        status: "ACTIVE",
        stripeCustomerId: pending.stripeCustomerId,
        stripeSubscriptionId: subId,
        currentPeriodEnd: pending.currentPeriodEnd,
      },
      update: {
        plan: FEATURED_PLAN,
        status: "ACTIVE",
        stripeCustomerId: pending.stripeCustomerId,
        stripeSubscriptionId: subId,
        currentPeriodEnd: pending.currentPeriodEnd,
      },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: {
        featured: true,
        featuredUntil: pending.currentPeriodEnd,
        ...(featuredScope ? { featuredScope } : {}),
      },
    });

    await prisma.pendingFeature.update({
      where: { id: pendingId },
      data: {
        status: "CLAIMED",
        claimedCompanyId: companyId,
        claimedByUserId: session.user.id,
        claimedAt: new Date(),
      },
    });
    ok = true;
  } catch (error) {
    console.error("[billing] error al asignar el pago a la empresa:", error);
  }

  if (!ok) redirect(`${backHref}&error=asignar`);
  redirect(`/dashboard/empresas/${companyId}/destacar?estado=ok`);
}
