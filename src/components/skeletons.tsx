import { Skeleton } from "@/components/ui/skeleton";

/** Cabecera de pagina (titulo + descripcion) en estado de carga. */
export function PageHeaderSkeleton() {
  return (
    <div className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="dotted-bg absolute inset-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 60% at 30% 0%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 30% 0%, black, transparent)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-5 h-9 w-2/3 max-w-md" />
        <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-1/2 max-w-sm" />
      </div>
    </div>
  );
}

/** Tarjeta de empresa en estado de carga (replica CompanyCard). */
export function CompanyCardSkeleton() {
  return (
    <div className="bg-card flex flex-col rounded-xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-12 rounded-lg" />
        <Skeleton className="size-4 rounded" />
      </div>
      <Skeleton className="mt-4 h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-4/5" />
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
}

/** Rejilla de tarjetas de empresa en estado de carga. */
export function CompanyGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CompanyCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Fila de "chips" (filtros / categorias) en estado de carga. */
export function ChipRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  );
}
