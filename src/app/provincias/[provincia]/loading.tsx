import { CompanyGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CompanyGridSkeleton />
      </div>
    </>
  );
}
