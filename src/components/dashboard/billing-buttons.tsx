"use client";

import { useActionState, useState } from "react";
import type { FeaturedScope } from "@prisma/client";
import { ArrowRight, Check, CreditCard, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  openBillingPortal,
  startCheckout,
  type BillingState,
} from "@/lib/actions/billing";
import {
  euro,
  FEATURED_TIER_ORDER,
  FEATURED_TIERS,
  tierForScope,
  type FeaturedTier,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const INITIAL: BillingState = {};

/** Boton que inicia el pago del plan Destacado (Stripe Checkout). */
export function CheckoutButton({
  companyId,
  label = "Destacar mi empresa",
}: {
  companyId: string;
  label?: string;
}) {
  const action = startCheckout.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <div>
      <form action={formAction}>
        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          <Sparkles className="size-4" />
          {pending ? "Redirigiendo a la pasarela..." : label}
          <ArrowRight className="size-4" />
        </Button>
      </form>
      {state.error && (
        <p className="text-destructive mt-2 text-sm">{state.error}</p>
      )}
    </div>
  );
}

/**
 * Selector de nivel (Regional 49,99 € / Nacional 99,99 €) + boton de pago.
 * El nivel viaja a startCheckout como campo "tier" del formulario.
 */
export function FeatureCheckout({
  companyId,
  initialScope,
}: {
  companyId: string;
  initialScope?: FeaturedScope | null;
}) {
  const action = startCheckout.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [tier, setTier] = useState<FeaturedTier>(tierForScope(initialScope));

  return (
    <form action={formAction}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          ¿Hasta donde quieres destacar?
        </legend>
        <div className="space-y-2">
          {FEATURED_TIER_ORDER.map((id) => {
            const t = FEATURED_TIERS[id];
            const active = tier === id;
            return (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                  active
                    ? "border-primary ring-primary/20 bg-primary/5 ring-1"
                    : "hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name="tier"
                  value={id}
                  checked={active}
                  onChange={() => setTier(id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "",
                  )}
                >
                  {active && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-sm font-medium">
                      {t.name}
                      {t.recommended && (
                        <span className="text-primary ml-2 text-xs font-semibold">
                          Recomendado
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold">
                      {euro(t.base)}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        / año + IVA
                      </span>
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {t.tagline}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {euro(t.total)} IVA incluido
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        disabled={pending}
        className="mt-5 w-full sm:w-auto"
      >
        <Sparkles className="size-4" />
        {pending ? "Redirigiendo a la pasarela..." : "Destacar mi empresa"}
        <ArrowRight className="size-4" />
      </Button>
      {state.error && (
        <p className="text-destructive mt-2 text-sm">{state.error}</p>
      )}
    </form>
  );
}

/** Boton que abre el portal de cliente de Stripe (gestionar/cancelar/facturas). */
export function PortalButton({ companyId }: { companyId: string }) {
  const action = openBillingPortal.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" size="lg" disabled={pending}>
          <CreditCard className="size-4" />
          {pending ? "Abriendo..." : "Gestionar suscripcion y facturas"}
        </Button>
      </form>
      {state.error && (
        <p className="text-destructive mt-2 text-sm">{state.error}</p>
      )}
    </div>
  );
}
