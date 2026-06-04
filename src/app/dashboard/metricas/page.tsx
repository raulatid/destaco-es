import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";
import { getMyCompanyMetrics } from "@/lib/data/dashboard";
import { formatCompact } from "@/lib/utils";

export default async function MetricasPage() {
  const session = await auth();
  if (!session?.user) notFound();

  const metrics = await getMyCompanyMetrics(session.user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Metricas</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Rendimiento de tus perfiles en Destaco: visitas, clics e indice de
        contacto.
      </p>

      {metrics.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Aun no hay metricas"
          description="Cuando reclames o publiques una empresa veras aqui sus visitas y clics."
        />
      ) : (
        <div className="mt-6 space-y-6">
          {metrics.map((m) => {
            const cards = [
              { label: "Visitas", value: m.viewCount },
              { label: "Impresiones", value: m.impressions },
              { label: "Clics web", value: m.websiteClicks },
              { label: "Clics telefono", value: m.phoneClicks },
              { label: "Clics email", value: m.emailClicks },
              { label: "Clics contacto", value: m.contactClicks },
            ];
            return (
              <div key={m.companyId} className="bg-card rounded-xl border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/empresa/${m.slug}`}
                    className="font-medium hover:underline"
                  >
                    {m.name}
                  </Link>
                  <div className="text-muted-foreground flex gap-4 text-xs">
                    <span>
                      Ranking:{" "}
                      <span className="text-foreground font-semibold tabular-nums">
                        {m.rankingScore.toFixed(1)}
                      </span>
                    </span>
                    <span>
                      Perfil:{" "}
                      <span className="text-foreground font-semibold tabular-nums">
                        {m.completionScore}%
                      </span>
                    </span>
                    <span>
                      CTR:{" "}
                      <span className="text-foreground font-semibold tabular-nums">
                        {(m.ctr * 100).toFixed(1)}%
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {cards.map((c) => (
                    <div key={c.label} className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xl font-semibold tabular-nums">
                        {formatCompact(c.value)}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {c.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
