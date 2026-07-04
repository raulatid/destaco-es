import { Building2 } from "lucide-react";

import { CompanyCard } from "@/components/company-card";
import { EmptyState } from "@/components/empty-state";
import { ImpressionTracker } from "@/components/metrics/impression-tracker";
import type { CompanyCardData } from "@/lib/data/types";

export function CompanyGrid({
  companies,
  emptyTitle = "Todavia no hay empresas aqui",
  emptyDescription = "Estamos ampliando el directorio cada dia. Vuelve pronto.",
}: {
  companies: CompanyCardData[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <ImpressionTracker slugs={companies.map((c) => c.slug)} />
      {companies.map((company) => (
        <CompanyCard key={company.slug} company={company} className="h-full" />
      ))}
    </div>
  );
}
