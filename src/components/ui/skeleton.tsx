import { cn } from "@/lib/utils";

/** Bloque de carga con animacion de pulso. Reutilizable en skeletons. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted/70 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
