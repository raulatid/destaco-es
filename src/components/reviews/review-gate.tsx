"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { ReviewForm } from "@/components/reviews/review-form";

/**
 * Decide en cliente si mostrar el formulario de resena o el aviso para iniciar
 * sesion. Asi la ficha de empresa NO necesita leer la sesion en el servidor y
 * puede servirse estatica/ISR (mucho mas rapida y mejor para SEO).
 */
export function ReviewGate({ companySlug }: { companySlug: string }) {
  const { status } = useSession();

  if (status === "authenticated") {
    return <ReviewForm companySlug={companySlug} />;
  }

  return (
    <p className="text-muted-foreground mt-4 text-sm">
      <Link href="/login" className="text-foreground font-medium">
        Inicia sesion
      </Link>{" "}
      para escribir una resena.
    </p>
  );
}
