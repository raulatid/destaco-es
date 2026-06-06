import {
  ChipRowSkeleton,
  CompanyGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="mt-4">
          <ChipRowSkeleton count={10} />
        </div>
        <div className="mt-8">
          <CompanyGridSkeleton />
        </div>
      </div>
    </>
  );
}
