import Link from "next/link";
import type { CompanyStatus } from "@prisma/client";
import { Building2, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getMyCompanies } from "@/lib/data/dashboard";
import { formatCompact } from "@/lib/utils";

const STATUS_META: Record<
  CompanyStatus,
  { label: string; variant: "muted" | "outline" | "success" }
> = {
  DRAFT: { label: "Borrador", variant: "muted" },
  PENDING: { label: "En revision", variant: "outline" },
  PUBLISHED: { label: "Publicada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "muted" },
  ARCHIVED: { label: "Archivada", variant: "muted" },
};

export default async function MisEmpresasPage() {
  const session = await auth();
  const companies = session?.user
    ? await getMyCompanies(session.user.id)
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mis empresas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona las fichas de tus empresas.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/dashboard/empresas/nueva">
            <Plus className="size-4" />
            Publicar empresa
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aun no tienes empresas"
            description="Publica tu primera empresa y empieza a recibir clientes."
          />
        ) : (
          companies.map((company) => {
            const meta = STATUS_META[company.status];
            return (
              <div
                key={company.id}
                className="bg-card flex flex-wrap items-center gap-4 rounded-xl border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{company.name}</p>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    {company.featured && (
                      <Badge variant="success">
                        <Sparkles className="size-3" />
                        Destacada
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {company.category}
                    {company.city ? ` · ${company.city}` : ""} ·{" "}
                    {formatCompact(company.viewCount)} visitas ·{" "}
                    {company.reviewCount} resenas
                  </p>
                </div>
                <div className="flex gap-2">
                  {company.status === "PUBLISHED" && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/empresa/${company.slug}`}>Ver ficha</Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/empresas/${company.id}/proyectos`}>
                      Portfolio
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/empresas/${company.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant={company.featured ? "ghost" : "brand"}
                  >
                    <Link href={`/dashboard/empresas/${company.id}/destacar`}>
                      <Sparkles className="size-4" />
                      {company.featured ? "Gestionar" : "Destacar"}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
