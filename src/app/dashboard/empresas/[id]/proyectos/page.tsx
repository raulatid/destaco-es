import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FolderOpen, Trash2 } from "lucide-react";

import { ProjectForm } from "@/components/dashboard/project-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getMyCompanyProjects } from "@/lib/data/dashboard";
import { deleteProject } from "@/lib/actions/projects";

export default async function ProyectosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const data = await getMyCompanyProjects(session.user.id, id);
  if (!data) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Portfolio de proyectos y casos de exito de {data.companyName}. Tus
            trabajos mejoran tu posicion en el ranking y tu perfil.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/empresa/${data.companySlug}`}>Ver perfil</Link>
        </Button>
      </div>

      <div className="mt-6">
        <ProjectForm companyId={data.companyId} />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold tracking-tight">
        Proyectos publicados ({data.projects.length})
      </h2>
      {data.projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aun no has añadido proyectos"
          description="Muestra tus mejores trabajos para destacar entre la competencia."
        />
      ) : (
        <div className="space-y-2">
          {data.projects.map((project) => (
            <div
              key={project.id}
              className="bg-card flex items-center justify-between gap-4 rounded-xl border p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{project.title}</p>
                <p className="text-muted-foreground text-sm">
                  {[
                    project.client,
                    project.date
                      ? new Date(project.date).toLocaleDateString("es-ES")
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sin detalles"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {project.url && (
                  <Button asChild variant="ghost" size="icon">
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                )}
                <form action={deleteProject}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="companyId" value={data.companyId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
