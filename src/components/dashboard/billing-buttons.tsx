"use client";

import { useActionState } from "react";
import { ArrowRight, CreditCard, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  openBillingPortal,
  startCheckout,
  type BillingState,
} from "@/lib/actions/billing";

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
