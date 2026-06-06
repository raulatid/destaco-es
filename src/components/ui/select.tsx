import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Select nativo con estilo moderno (chevron propio, foco con anillo, hover).
 * Mantiene la accesibilidad y el comportamiento nativo en movil.
 */
export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative inline-flex w-full">
      <select
        className={cn(
          "border-border bg-card hover:bg-accent/40 focus-visible:ring-ring/40 focus-visible:border-ring w-full cursor-pointer appearance-none rounded-lg border py-2 pr-9 pl-3 text-sm font-medium shadow-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
    </div>
  );
}
