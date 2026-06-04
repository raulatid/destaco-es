import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";

import { CompanyForm } from "@/components/dashboard/company-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { getMyCompany } from "@/lib/data/dashboard";
import { listProvinces } from "@/lib/data/locations";
import { updateCompany } from "../../actions";

export default async function EditarEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const [company, categories, provinces] = await Promise.all([
    getMyCompany(session.user.id, id),
    listCategories(),
    listProvinces(),
  ]);
  if (!company) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar empresa
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Actualiza la informacion de {company.name}.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/empresas/${id}/proyectos`}>
            <FolderOpen className="size-4" />
            Proyectos
          </Link>
        </Button>
      </div>

      <div className="bg-card mt-6 rounded-xl border p-6">
        <CompanyForm
          categories={categories}
          provinces={provinces}
          action={updateCompany}
          initial={company}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
