import { NextResponse, type NextRequest } from "next/server";
import type { FeaturedScope, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { FEATURED_PLAN, getStripe } from "@/lib/stripe";

// El webhook necesita el runtime de Node (firma con crypto) y el cuerpo crudo.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mapea el estado de la suscripcion de Stripe al enum de la base de datos. */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      // incomplete, incomplete_expired, paused...
      return "INCOMPLETE";
  }
}

/**
 * Lee el fin del periodo. En Stripe v18+ `current_period_end` vive en el item de
 * la suscripcion; mantenemos el fallback al campo antiguo por compatibilidad.
 */
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  const ts =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

/** Sincroniza una suscripcion de Stripe con la base de datos (idempotente). */
async function syncSubscription(sub: Stripe.Subscription) {
  const companyId = sub.metadata?.companyId;
  if (!companyId) {
    console.warn("[stripe] suscripcion sin companyId en metadata:", sub.id);
    return;
  }

  const status = mapStatus(sub.status);
  const periodEnd = getPeriodEnd(sub);
  const isActive = status === "ACTIVE" || status === "TRIALING";
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Alcance del destacado elegido al contratar (viaja en la metadata).
  const scopeRaw = sub.metadata?.featuredScope;
  const featuredScope: FeaturedScope | undefined =
    scopeRaw === "NACIONAL" || scopeRaw === "PROVINCIAL" || scopeRaw === "LOCAL"
      ? scopeRaw
      : undefined;

  // Si la empresa fue borrada, no hacemos nada (evita fallo de FK).
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) {
    console.warn("[stripe] empresa inexistente para la suscripcion:", companyId);
    return;
  }

  await prisma.subscription.upsert({
    where: { companyId },
    create: {
      companyId,
      plan: FEATURED_PLAN,
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan: FEATURED_PLAN,
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: periodEnd,
    },
  });

  await prisma.company.update({
    where: { id: companyId },
    data: {
      featured: isActive,
      featuredUntil: isActive ? periodEnd : null,
      ...(featuredScope ? { featuredScope } : {}),
    },
  });
}

/**
 * Sincroniza un pago "Destacado" SIN empresa asociada (flujo pago-primero) en un
 * PendingFeature. El cliente lo reclamara luego en /destacar/completar. Si el pago
 * ya fue reclamado (status CLAIMED) no tocamos nada: manda la Subscription real.
 */
async function syncPendingFeature(
  sub: Stripe.Subscription,
  email: string | null,
  sessionId: string | null,
  opts: { canceled?: boolean } = {},
) {
  const existing = await prisma.pendingFeature.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { status: true },
  });
  if (existing?.status === "CLAIMED") return;

  const tier = sub.metadata?.tier === "NACIONAL" ? "NACIONAL" : "REGIONAL";
  const scopeRaw = sub.metadata?.featuredScope;
  const featuredScope: FeaturedScope | undefined =
    scopeRaw === "NACIONAL" || scopeRaw === "PROVINCIAL" || scopeRaw === "LOCAL"
      ? scopeRaw
      : undefined;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const periodEnd = getPeriodEnd(sub);
  const status = mapStatus(sub.status);
  const nextStatus =
    opts.canceled || status === "CANCELED" ? "CANCELED" : "PENDING";

  // Email: del checkout si lo tenemos; si no, lo pedimos al cliente de Stripe.
  let resolvedEmail = email;
  if (!resolvedEmail) {
    try {
      const customer = await getStripe().customers.retrieve(customerId);
      if (!("deleted" in customer && customer.deleted)) {
        resolvedEmail = (customer as Stripe.Customer).email ?? null;
      }
    } catch (error) {
      console.warn("[stripe] no se pudo leer el email del cliente:", error);
    }
  }

  await prisma.pendingFeature.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      email: resolvedEmail ?? "",
      tier,
      featuredScope,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripeSessionId: sessionId ?? undefined,
      currentPeriodEnd: periodEnd,
      status: nextStatus,
    },
    update: {
      ...(resolvedEmail ? { email: resolvedEmail } : {}),
      ...(featuredScope ? { featuredScope } : {}),
      stripeCustomerId: customerId,
      ...(sessionId ? { stripeSessionId: sessionId } : {}),
      currentPeriodEnd: periodEnd,
      status: nextStatus,
    },
  });
}

/** Distribuye una suscripcion al flujo normal (con empresa) o al pago-primero. */
async function routeSubscription(
  sub: Stripe.Subscription,
  opts: { canceled?: boolean } = {},
) {
  if (sub.metadata?.companyId) {
    await syncSubscription(sub);
  } else if (sub.metadata?.kind === "prepaid") {
    await syncPendingFeature(sub, null, null, opts);
  } else {
    console.warn("[stripe] suscripcion sin companyId ni kind prepaid:", sub.id);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET no configurado.");
    return NextResponse.json({ error: "webhook no configurado" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "falta la firma" }, { status: 400 });
  }

  const payload = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe] firma de webhook invalida:", error);
    return NextResponse.json({ error: "firma invalida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        if (checkout.subscription) {
          const subId =
            typeof checkout.subscription === "string"
              ? checkout.subscription
              : checkout.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          const isPrepaid =
            (checkout.metadata?.kind === "prepaid" ||
              sub.metadata?.kind === "prepaid") &&
            !sub.metadata?.companyId &&
            !checkout.metadata?.companyId;
          if (isPrepaid) {
            // Pago-primero: aun no hay empresa. Guardamos el pago como pendiente.
            const email =
              checkout.customer_details?.email ??
              checkout.customer_email ??
              null;
            await syncPendingFeature(sub, email, checkout.id);
          } else {
            // Garantiza el companyId en la suscripcion por si faltara.
            if (!sub.metadata?.companyId && checkout.metadata?.companyId) {
              sub.metadata = {
                ...sub.metadata,
                companyId: checkout.metadata.companyId,
              };
            }
            await syncSubscription(sub);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await routeSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        await routeSubscription(event.data.object as Stripe.Subscription, {
          canceled: true,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = (
          invoice as unknown as { subscription?: string | { id: string } }
        ).subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await routeSubscription(sub);
        }
        break;
      }

      default:
        // Ignoramos el resto de eventos.
        break;
    }
  } catch (error) {
    console.error("[stripe] error procesando el webhook:", error);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
