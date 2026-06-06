"use client";

import { useActionState } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestClaim, type ClaimState } from "@/lib/actions/claims";
import { cn } from "@/lib/utils";

const INITIAL: ClaimState = {};

const controlClass =
  "flex w-full rounded-lg border bg-background px-3.5 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

export function ClaimForm({
  companySlug,
  companyDomain,
}: {
  companySlug: string;
  companyName: string;
  companyDomain?: string | null;
}) {
  const action = requestClaim.bind(null, companySlug);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  if (state.success) {
    return (
      <div className="bg-card flex items-start gap-3 rounded-xl border p-5">
        <MailCheck className="text-success size-5 shrink-0" />
        <p className="text-sm leading-relaxed">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-card space-y-4 rounded-xl border p-6">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email corporativo
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder={`nombre@${companyDomain ?? "tuempresa.com"}`}
        />
        <p className="text-muted-foreground text-xs">
          Usa un correo del dominio de la empresa para que la verificacion sea
          automatica.
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="evidence" className="text-sm font-medium">
          Informacion adicional <span className="text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="evidence"
          name="evidence"
          rows={3}
          placeholder="Tu cargo, web, o cualquier dato que ayude a verificar tu relacion con la empresa."
          className={cn(controlClass, "leading-relaxed")}
        />
      </div>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <CheckCircle2 className="size-3.5" />
        Te enviaremos un enlace seguro de verificacion (caduca en 48 h).
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" variant="brand" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar verificacion"}
      </Button>
    </form>
  );
}
