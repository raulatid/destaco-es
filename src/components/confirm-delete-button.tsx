"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ServerAction = (formData: FormData) => void | Promise<void>;

/**
 * Boton de borrado con confirmacion en linea (sin dialogo de navegador).
 * Primer clic -> pregunta "¿Seguro?"; el segundo confirma y envia el formulario
 * a la `action` (un server action que recibe el `id` por campo oculto).
 */
export function ConfirmDeleteButton({
  action,
  id,
  label = "Eliminar",
  confirmLabel = "Si, eliminar",
  pendingLabel = "Eliminando...",
  size = "sm",
}: {
  action: ServerAction;
  id: string;
  label?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  size?: "sm" | "default";
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => setConfirming(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
        {label}
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-muted-foreground text-sm">¿Seguro?</span>
      <SubmitButton confirmLabel={confirmLabel} pendingLabel={pendingLabel} size={size} />
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => setConfirming(false)}
      >
        Cancelar
      </Button>
    </form>
  );
}

function SubmitButton({
  confirmLabel,
  pendingLabel,
  size,
}: {
  confirmLabel: string;
  pendingLabel: string;
  size: "sm" | "default";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size={size} disabled={pending}>
      {pending ? pendingLabel : confirmLabel}
    </Button>
  );
}
