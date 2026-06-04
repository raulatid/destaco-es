import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { listAdminJobs } from "@/lib/data/admin";

const STATUS_VARIANT: Record<
  string,
  "muted" | "outline" | "success" | "default"
> = {
  COMPLETED: "success",
  RUNNING: "outline",
  QUEUED: "muted",
  FAILED: "muted",
  CANCELLED: "muted",
};

export default async function AdminIngestaPage() {
  const jobs = await listAdminJobs();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Ingesta y jobs
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Historial de trabajos de ingesta de datos y enriquecimiento con IA.
      </p>

      <div className="mt-6 space-y-2">
        {jobs.length === 0 ? (
          <EmptyState
            title="Todavia no hay jobs"
            description="Ejecuta la ingesta o el enriquecimiento para ver el historial aqui."
          />
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-card rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{job.type}</span>
                <Badge variant={STATUS_VARIANT[job.status] ?? "muted"}>
                  {job.status}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {job.source}
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(job.createdAt).toLocaleString("es-ES")}
                </span>
              </div>
              {job.query && (
                <p className="mt-1.5 text-sm">{job.query}</p>
              )}
              {typeof job.stats === "object" && job.stats !== null && (
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {JSON.stringify(job.stats)}
                </p>
              )}
              {job.error && (
                <p className="text-destructive mt-1 text-xs">{job.error}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
