import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";

export function PageHeader({
  crumbs,
  title,
  description,
  meta,
}: {
  crumbs?: Crumb[];
  title: string;
  description?: string;
  meta?: React.ReactNode;
}) {
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
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-3 max-w-2xl text-pretty">
            {description}
          </p>
        )}
        {meta && (
          <div className="text-muted-foreground mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}
