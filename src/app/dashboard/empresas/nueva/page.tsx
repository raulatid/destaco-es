import { CompanyForm } from "@/components/dashboard/company-form";
import { listCategories } from "@/lib/data/categories";
import { listProvinces } from "@/lib/data/locations";
import { createCompany } from "../actions";

export default async function NuevaEmpresaPage() {
  const [categories, provinces] = await Promise.all([
    listCategories(),
    listProvinces(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        Publicar empresa
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Crea la ficha de tu empresa. Se revisara antes de publicarse.
      </p>

      <div className="bg-card mt-6 rounded-xl border p-6">
        <CompanyForm
          categories={categories}
          provinces={provinces}
          action={createCompany}
          submitLabel="Publicar empresa"
        />
      </div>
    </div>
  );
}
