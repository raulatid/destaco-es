import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      {/* Cabecera */}
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
          <Skeleton className="h-4 w-64" />
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <Skeleton className="size-20 shrink-0 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-8 w-2/3 max-w-xs" />
              <Skeleton className="mt-3 h-4 w-1/2 max-w-sm" />
              <Skeleton className="mt-3 h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </section>
          <section>
            <Skeleton className="h-6 w-32" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </section>
          <section>
            <Skeleton className="h-6 w-56" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </aside>
      </div>
    </>
  );
}
