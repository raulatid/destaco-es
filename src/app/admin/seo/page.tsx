import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { getAdminSeoOverview } from "@/lib/data/admin";

const STATUS_VARIANT: Record<string, "muted" | "outline" | "success"> = {
  INDEXED: "success",
  CRAWLED: "outline",
  DISCOVERED: "outline",
  EXCLUDED: "muted",
  UNKNOWN: "muted",
  ERROR: "muted",
};

const KIND_LABEL: Record<string, string> = {
  category: "Categorias",
  city: "Ciudades",
  province: "Provincias",
  category_city: "Categoria + ciudad",
  company: "Empresas",
};

export default async function AdminSeoPage() {
  const { stats, logs } = await getAdminSeoOverview();

  const summaryCards = [
    { label: "Paginas totales", value: stats.totalPages },
    { label: "Indexables", value: stats.indexable },
    { label: "Con noindex", value: stats.noindex },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">SEO e indexacion</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Estado de las paginas programaticas y de la integracion con Google
        Search Console. Enviar el sitemap o inspeccionar una URL informa a
        Google, pero no garantiza ni acelera la indexacion: Google decide.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-card rounded-xl border p-4">
            <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Estado de indexacion
          </h2>
          <div className="space-y-2">
            {Object.keys(stats.byStatus).length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin datos todavia.</p>
            ) : (
              Object.entries(stats.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="bg-card flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <Badge variant={STATUS_VARIANT[status] ?? "muted"}>
                    {status}
                  </Badge>
                  <span className="font-semibold tabular-nums">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Paginas por tipo
          </h2>
          <div className="space-y-2">
            {Object.keys(stats.byKind).length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin datos todavia.</p>
            ) : (
              Object.entries(stats.byKind).map(([kind, count]) => (
                <div
                  key={kind}
                  className="bg-card flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <span className="text-sm">{KIND_LABEL[kind] ?? kind}</span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold tracking-wide uppercase">
        Actividad en Search Console
      </h2>
      {logs.length === 0 ? (
        <EmptyState
          title="Sin actividad aun"
          description="Cuando el cron envie el sitemap o inspeccione URLs veras aqui el registro."
        />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-card rounded-xl border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-medium">
                  {log.action}
                </span>
                <Badge variant={STATUS_VARIANT[log.status] ?? "muted"}>
                  {log.status}
                </Badge>
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(log.createdAt).toLocaleString("es-ES")}
                </span>
              </div>
              {log.targetUrl && (
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  {log.targetUrl}
                </p>
              )}
              {log.error && (
                <p className="text-destructive mt-1 text-xs">{log.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
