import Link from "next/link";
import type { CompanyStatus } from "@prisma/client";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminCompanies } from "@/lib/data/admin";
import { cn } from "@/lib/utils";
import { approveCompany, rejectCompany } from "./actions";

const VALID: CompanyStatus[] = [
  "DRAFT",
  "PENDING",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
];

const FILTERS: { value?: CompanyStatus; label: string }[] = [
  { label: "Todas" },
  { value: "DRAFT", label: "Sin enriquecer" },
  { value: "PENDING", label: "Pendientes" },
  { value: "PUBLISHED", label: "Publicadas" },
  { value: "REJECTED", label: "Rechazadas" },
];

const STATUS_META: Record<
  CompanyStatus,
  { label: string; variant: "muted" | "outline" | "success" }
> = {
  DRAFT: { label: "Sin enriquecer", variant: "muted" },
  PENDING: { label: "Pendiente", variant: "outline" },
  PUBLISHED: { label: "Publicada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "muted" },
  ARCHIVED: { label: "Archivada", variant: "muted" },
};

export default async function AdminEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const status =
    estado && VALID.includes(estado as CompanyStatus)
      ? (estado as CompanyStatus)
      : undefined;
  const companies = await listAdminCompanies(status);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Modera, aprueba y rechaza las empresas del directorio.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/admin/empresas?estado=${filter.value}`
                  : "/admin/empresas"
              }
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-2">
        {companies.length === 0 ? (
          <EmptyState
            title="No hay empresas que mostrar"
            description="Conecta PostgreSQL y ejecuta la ingesta para empezar a moderar empresas."
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
                    <Link
                      href={`/empresa/${company.slug}`}
                      className="font-medium hover:underline"
                    >
                      {company.name}
                    </Link>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {company.category}
                    {company.city ? ` · ${company.city}` : ""} ·{" "}
                    {company.source} ·{" "}
                    {new Date(company.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {company.status !== "PUBLISHED" && (
                    <form action={approveCompany}>
                      <input type="hidden" name="id" value={company.id} />
                      <Button type="submit" size="sm" variant="brand">
                        Aprobar
                      </Button>
                    </form>
                  )}
                  {company.status !== "REJECTED" && (
                    <form action={rejectCompany}>
                      <input type="hidden" name="id" value={company.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Rechazar
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
