import { PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-2 h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
