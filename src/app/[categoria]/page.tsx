import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin } from "lucide-react";

import { CompanyGrid } from "@/components/company-grid";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SortControl } from "@/components/sort-control";
import { getCategoryBySlug } from "@/lib/data/categories";
import { listCompanies } from "@/lib/data/companies";
import { TOP_CITIES } from "@/lib/constants";
import { isSortOption } from "@/lib/ranking";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd } from "@/lib/seo";
import { formatCompact } from "@/lib/utils";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) return {};
  return buildMetadata({
    title:
      category.metaTitle ?? `Empresas de ${category.name} en Espana`,
    description:
      category.metaDescription ??
      category.description ??
      `Directorio de empresas de ${category.name} en Espana. Compara valoraciones, servicios y precios.`,
    path: `/${categoria}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { categoria } = await params;
  const { page: pageParam, sort: sortParam } = await searchParams;
  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const sort = isSortOption(sortParam) ? sortParam : "score";
  const result = await listCompanies({ categorySlug: categoria, page, sort });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Categorias", path: "/categorias" },
          { name: category.name, path: `/${categoria}` },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          result.items.map((c) => ({
            name: c.name,
            path: `/empresa/${c.slug}`,
          })),
          `Empresas de ${category.name}`,
        )}
      />

      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: "Categorias", href: "/categorias" },
          { name: category.name },
        ]}
        title={`Empresas de ${category.name} en Espana`}
        description={
          category.description ??
          `Las mejores empresas de ${category.name.toLowerCase()}, verificadas y valoradas.`
        }
        meta={
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            {formatCompact(result.total || category.companyCount)} empresas
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {result.items.length > 0 && (
          <div className="mb-6 flex justify-end">
            <SortControl value={sort} />
          </div>
        )}
        <CompanyGrid
          companies={result.items}
          emptyTitle={`Aun no hay empresas de ${category.name.toLowerCase()}`}
          emptyDescription="Estamos ampliando el directorio. Conecta la base de datos y ejecuta la ingesta para llenar esta categoria."
        />
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          makeHref={(p) => {
            const qs = new URLSearchParams();
            if (p > 1) qs.set("page", String(p));
            if (sort !== "score") qs.set("sort", sort);
            const query = qs.toString();
            return query ? `/${categoria}?${query}` : `/${categoria}`;
          }}
        />

        <section className="mt-16">
          <h2 className="text-xl font-semibold tracking-tight">
            {category.name} por ciudad
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Explora las mejores empresas de {category.name.toLowerCase()} en tu
            ciudad.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/${categoria}/${city.slug}`}
                className="group bg-card hover:border-foreground/20 flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 hover:shadow-md"
              >
                <div className="bg-muted text-muted-foreground group-hover:text-foreground grid size-9 shrink-0 place-items-center rounded-lg border transition-colors">
                  <MapPin className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  {category.name.split(" ")[0]} en {city.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
