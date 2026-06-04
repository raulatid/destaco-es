import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { listCategories } from "@/lib/data/categories";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatCompact } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Todas las categorias de empresas",
  description:
    "Explora el directorio de empresas de Espana por sector: marketing, abogados, dentistas, restaurantes, reformas y mucho mas.",
  path: "/categorias",
});

export default async function CategoriasPage() {
  const categories = await listCategories();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Categorias", path: "/categorias" },
        ])}
      />
      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Categorias" }]}
        title="Categorias de empresas"
        description="Encuentra el sector que buscas y descubre las mejores empresas de cada categoria en toda Espana."
        meta={<span>{categories.length} categorias</span>}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="group bg-card hover:border-foreground/20 flex h-full items-start gap-4 rounded-xl border p-5 transition-all duration-300 hover:shadow-md"
            >
              <div className="bg-muted text-muted-foreground group-hover:text-foreground grid size-11 shrink-0 place-items-center rounded-lg border transition-colors">
                <CategoryIcon name={category.icon} className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold tracking-tight">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {category.description}
                  </p>
                )}
                <p className="text-muted-foreground/80 mt-2 text-xs font-medium">
                  {formatCompact(category.companyCount)} empresas
                </p>
              </div>
              <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
