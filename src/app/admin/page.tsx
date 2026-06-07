import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { TrendCard } from "@/components/admin/trend-chart";
import { getAdminStats, getAdminTrends } from "@/lib/data/admin";
import { formatCompact } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [stats, trends] = await Promise.all([
    getAdminStats(),
    getAdminTrends(),
  ]);

  const kpis = [
    {
      label: "Altas manuales de empresas",
      value: stats.manualCompanies,
      sub: "Empresas creadas por usuarios",
      data: trends.manualCompanies,
      href: "/admin/empresas",
    },
    {
      label: "Perfiles reclamados",
      value: stats.claims,
      sub: `${formatCompact(stats.approvedClaims)} aprobadas`,
      data: trends.claims,
      href: "/admin/reclamaciones",
    },
    {
      label: "Usuarios registrados",
      value: stats.users,
      sub: "Cuentas creadas en Destaco",
      data: trends.users,
    },
    {
      label: "Usuarios pagando",
      value: stats.payingUsers,
      sub: `${formatCompact(stats.payingCompanies)} ${
        stats.payingCompanies === 1
          ? "empresa destacada"
          : "empresas destacadas"
      }`,
      data: trends.payingCompanies,
    },
  ];

  const cards: { label: string; value: number; href?: string }[] = [
    { label: "Empresas totales", value: stats.total },
    {
      label: "Sin enriquecer (DRAFT)",
      value: stats.draft,
      href: "/admin/empresas?estado=DRAFT",
    },
    {
      label: "Pendientes de aprobar",
      value: stats.pending,
      href: "/admin/empresas?estado=PENDING",
    },
    {
      label: "Publicadas",
      value: stats.published,
      href: "/admin/empresas?estado=PUBLISHED",
    },
    {
      label: "Rechazadas",
      value: stats.rejected,
      href: "/admin/empresas?estado=REJECTED",
    },
    {
      label: "Resenas por moderar",
      value: stats.pendingReviews,
      href: "/admin/resenas?estado=PENDING",
    },
    { label: "Jobs de ingesta", value: stats.jobs, href: "/admin/ingesta" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Estado general del directorio Destaco.es.
      </p>

      <h2 className="mt-8 text-sm font-semibold tracking-tight">
        Negocio
        <span className="text-muted-foreground ml-2 font-normal">
          ultimos 12 meses
        </span>
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <TrendCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold tracking-tight">Directorio</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const inner = (
            <>
              <p className="text-muted-foreground text-sm">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {formatCompact(card.value)}
              </p>
            </>
          );
          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className="bg-card hover:border-foreground/20 rounded-xl border p-5 transition-all hover:shadow-md"
            >
              {inner}
            </Link>
          ) : (
            <div key={card.label} className="bg-card rounded-xl border p-5">
              {inner}
            </div>
          );
        })}
      </div>

      {stats.pending > 0 && (
        <Link
          href="/admin/empresas?estado=PENDING"
          className="bg-card hover:border-foreground/20 mt-4 flex items-center gap-3 rounded-xl border p-5 transition-all hover:shadow-md"
        >
          <div className="bg-muted text-foreground grid size-10 shrink-0 place-items-center rounded-lg border">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {stats.pending} empresas esperan tu aprobacion
            </p>
            <p className="text-muted-foreground text-sm">
              Revisa el contenido enriquecido con IA y publicalas.
            </p>
          </div>
          <ArrowRight className="text-muted-foreground size-4" />
        </Link>
      )}
    </div>
  );
}
