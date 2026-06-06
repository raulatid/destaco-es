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
  cn,
  FEATURED_SCOPE_HINT,
  FEATURED_SCOPE_LABEL,
  FEATURED_SCOPES,
} from "@/lib/utils";

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
 * Selector de alcance (localidad / provincia / nacional) + boton de pago.
 * El alcance viaja a startCheckout como campo "scope" del formulario.
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
  const [scope, setScope] = useState<FeaturedScope>(initialScope ?? "NACIONAL");

  return (
    <form action={formAction}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          ¿Donde quieres destacar?
        </legend>
        <div className="space-y-2">
          {FEATURED_SCOPES.map((value) => {
            const active = scope === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                  active
                    ? "border-primary ring-primary/20 bg-primary/5 ring-1"
                    : "hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name="scope"
                  value={value}
                  checked={active}
                  onChange={() => setScope(value)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                    active ? "border-primary bg-primary text-primary-foreground" : "",
                  )}
                >
                  {active && <Check className="size-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {FEATURED_SCOPE_LABEL[value]}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {FEATURED_SCOPE_HINT[value]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Mismo precio en cualquier alcance.
        </p>
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
