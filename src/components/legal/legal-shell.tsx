import type { ReactNode } from "react";

import { SITE } from "@/lib/constants";

/**
 * Contenedor comun para las paginas legales (/legal/*). Da ancho de lectura,
 * cabecera con fecha de actualizacion y estilos de prosa via variantes
 * arbitrarias de Tailwind, evitando repetir clases en cada parrafo.
 */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Última actualización: {updated} · {SITE.name}
      </p>
      <article className="text-muted-foreground mt-8 space-y-4 text-sm leading-relaxed [&_a]:text-foreground [&_a]:underline [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </article>
    </div>
  );
}
