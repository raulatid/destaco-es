"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject, type ProjectState } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";

const INITIAL: ProjectState = {};

const controlClass =
  "flex w-full rounded-lg border bg-background px-3.5 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

export function ProjectForm({ companyId }: { companyId: string }) {
  const action = createProject.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-card space-y-3 rounded-xl border p-6"
    >
      <p className="font-medium">Añadir proyecto</p>
      <Input name="title" required placeholder="Titulo del proyecto" />
      <textarea
        name="description"
        rows={3}
        placeholder="Describe el proyecto, el reto y la solucion..."
        className={cn(controlClass, "leading-relaxed")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="client" placeholder="Cliente (opcional)" />
        <Input name="date" type="date" aria-label="Fecha" />
      </div>
      <Input name="result" placeholder="Resultado / impacto (opcional)" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="url" type="url" placeholder="https://enlace-al-caso (opcional)" />
        <Input name="coverImage" type="url" placeholder="URL imagen de portada (opcional)" />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && (
        <p className="text-success text-sm">Proyecto añadido.</p>
      )}
      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Guardando..." : "Añadir proyecto"}
      </Button>
    </form>
  );
}
