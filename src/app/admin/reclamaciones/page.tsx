import Link from "next/link";
import type { ClaimStatus } from "@prisma/client";
import { BadgeCheck, MailCheck } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminClaims } from "@/lib/data/admin";
import { cn } from "@/lib/utils";
import { approveClaim, rejectClaim } from "./actions";

const VALID: ClaimStatus[] = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"];

const FILTERS: { value?: ClaimStatus; label: string }[] = [
  { label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobadas" },
  { value: "REJECTED", label: "Rechazadas" },
  { value: "EXPIRED", label: "Caducadas" },
];

const STATUS_META: Record<
  ClaimStatus,
  { label: string; variant: "muted" | "outline" | "success" }
> = {
  PENDING: { label: "Pendiente", variant: "outline" },
  APPROVED: { label: "Aprobada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "muted" },
  EXPIRED: { label: "Caducada", variant: "muted" },
};

export default async function AdminReclamacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const status =
    estado && VALID.includes(estado as ClaimStatus)
      ? (estado as ClaimStatus)
      : undefined;
  const claims = await listAdminClaims(status);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reclamaciones</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Aprueba o rechaza las solicitudes de propiedad de perfiles. Las que
        proceden de un dominio corporativo coincidente se aprueban solas tras
        verificar el email.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/admin/reclamaciones?estado=${filter.value}`
                  : "/admin/reclamaciones"
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
        {claims.length === 0 ? (
          <EmptyState
            title="No hay reclamaciones que mostrar"
            description="Las solicitudes de reclamacion de perfiles apareceran aqui."
          />
        ) : (
          claims.map((claim) => {
            const meta = STATUS_META[claim.status];
            return (
              <div key={claim.id} className="bg-card rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/empresa/${claim.companySlug}`}
                    className="font-medium hover:underline"
                  >
                    {claim.companyName}
                  </Link>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {claim.domainMatch && (
                    <Badge variant="outline" className="gap-1">
                      <BadgeCheck className="size-3" /> Dominio coincide
                    </Badge>
                  )}
                  {claim.verified && (
                    <Badge variant="outline" className="gap-1">
                      <MailCheck className="size-3" /> Email verificado
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {claim.userName} · {claim.claimantEmail} ·{" "}
                  {new Date(claim.createdAt).toLocaleDateString("es-ES")}
                </p>
                {claim.evidence && (
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {claim.evidence}
                  </p>
                )}
                {(claim.status === "PENDING" || claim.status === "EXPIRED") && (
                  <div className="mt-3 flex gap-2">
                    <form action={approveClaim}>
                      <input type="hidden" name="id" value={claim.id} />
                      <Button type="submit" size="sm" variant="brand">
                        Aprobar
                      </Button>
                    </form>
                    <form action={rejectClaim}>
                      <input type="hidden" name="id" value={claim.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
