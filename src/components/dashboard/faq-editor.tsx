"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Faq {
  question: string;
  answer: string;
}

const controlClass =
  "flex w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

/**
 * Editor de preguntas frecuentes: lista dinámica de pregunta + respuesta. Se
 * envía con el formulario en un input oculto (JSON). Sustituye a las FAQs
 * generadas por IA cuando el dueño las personaliza.
 */
export function FaqEditor({ initial = [] }: { initial?: Faq[] }) {
  const [faqs, setFaqs] = useState<Faq[]>(initial);

  const update = (i: number, patch: Partial<Faq>) =>
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const remove = (i: number) =>
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setFaqs((prev) => [...prev, { question: "", answer: "" }]);

  // Solo enviamos las que tienen pregunta y respuesta.
  const clean = faqs.filter((f) => f.question.trim() && f.answer.trim());

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">
        Preguntas frecuentes
      </span>
      <p className="text-muted-foreground mb-3 text-xs">
        Añade las dudas típicas de tus clientes y respóndelas tú mismo. Si no
        pones ninguna, mostramos unas automáticas.
      </p>
      <input type="hidden" name="faqs" value={JSON.stringify(clean)} />

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-card rounded-xl border p-3.5">
            <div className="flex items-start gap-2">
              <Input
                value={faq.question}
                onChange={(e) => update(i, { question: e.target.value })}
                placeholder="Pregunta (p. ej. ¿Hacéis presupuesto gratis?)"
                className="flex-1"
                maxLength={300}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar pregunta"
                onClick={() => remove(i)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <textarea
              value={faq.answer}
              onChange={(e) => update(i, { answer: e.target.value })}
              placeholder="Respuesta"
              rows={2}
              maxLength={2000}
              className={cn(controlClass, "mt-2 leading-relaxed")}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={add}
      >
        <Plus className="size-4" />
        Añadir pregunta
      </Button>
    </div>
  );
}
