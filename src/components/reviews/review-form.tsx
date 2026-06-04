"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitReview, type ReviewState } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

const INITIAL: ReviewState = {};

const controlClass =
  "flex w-full rounded-lg border bg-background px-3.5 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

export function ReviewForm({ companySlug }: { companySlug: string }) {
  const action = submitReview.bind(null, companySlug);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  if (state.success) {
    return (
      <div className="bg-card mt-4 flex items-center gap-3 rounded-xl border p-5">
        <CheckCircle2 className="text-success size-5 shrink-0" />
        <p className="text-sm">
          Gracias por tu resena. Se publicara tras la revision del equipo.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="bg-card mt-4 space-y-3 rounded-xl border p-5"
    >
      <p className="font-medium">Escribe una resena</p>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <select
          name="rating"
          defaultValue="5"
          aria-label="Valoracion"
          className={cn(controlClass, "h-10")}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "estrella" : "estrellas"}
            </option>
          ))}
        </select>
        <Input name="title" placeholder="Titulo (opcional)" />
      </div>
      <textarea
        name="body"
        rows={4}
        required
        placeholder="Cuenta tu experiencia con esta empresa..."
        className={cn(controlClass, "leading-relaxed")}
      />
      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Enviando..." : "Publicar resena"}
      </Button>
    </form>
  );
}
