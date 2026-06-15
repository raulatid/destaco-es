import { ArrowRight, TrendingUp } from "lucide-react";

/**
 * Banner promocional fijo en la parte superior del sitio (encima del header).
 * Cross-promo de Selspy. Todo el banner es clicable y ademas muestra un boton
 * explicito que lleva a selspy.es.
 */
export function PromoBanner() {
  return (
    <div className="bg-brand-gradient text-primary-foreground">
      <a
        href="https://selspy.es"
        target="_blank"
        rel="noopener noreferrer"
        className="group mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center sm:px-6 lg:px-8"
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-medium sm:text-sm">
          <TrendingUp className="hidden size-4 shrink-0 sm:inline" aria-hidden />
          Aumenta las ventas de tu negocio con la IA Selspy
        </span>
        <span className="bg-primary-foreground/15 ring-primary-foreground/25 group-hover:bg-primary-foreground/25 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[13px] font-semibold ring-1 transition-colors">
          Probar Selspy
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </a>
    </div>
  );
}
