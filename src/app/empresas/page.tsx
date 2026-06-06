import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { CompanyGrid } from "@/components/company-grid";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { listCategories } from "@/lib/data/categories";
import { listCompanies } from "@/lib/data/companies";
import { buildMetadata } from "@/lib/seo";
import { cn, formatCompact, slugify } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    ubicacion?: string;
    categoria?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q, categoria, ubicacion, page } = await searchParams;
  return buildMetadata({
    title: q ? `Resultados para "${q}"` : "Todas las empresas",
    description:
      "Busca y compara empresas verificadas de toda Espana por sector, ciudad y valoraciones.",
    path: "/empresas",
    // Solo /empresas (sin filtros ni paginacion) se indexa; las vistas
    // filtradas/buscadas/paginadas son "thin"/duplicadas: noindex, follow.
    noindex: Boolean(q || categoria || ubicacion) || (Number(page) || 1) > 1,
  });
}

export default async function EmpresasPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const ubicacion = sp.ubicacion?.trim() || undefined;
  const categoria = sp.categoria || undefined;
  const citySlug = ubicacion ? slugify(ubicacion) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, categories] = await Promise.all([
    listCompanies({ query: q, categorySlug: categoria, citySlug, page }),
    listCategories(),
  ]);

  const makeHref = (target: { categoria?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (ubicacion) params.set("ubicacion", ubicacion);
    const cat = target.categoria;
    if (cat) params.set("categoria", cat);
    if (target.page && target.page > 1) params.set("page", String(target.page));
    const qs = params.toString();
    return qs ? `/empresas?${qs}` : "/empresas";
  };

  const activeCategory = categories.find((c) => c.slug === categoria);
  const title = q
    ? `Resultados para "${q}"`
    : activeCategory
      ? `Empresas de ${activeCategory.name}`
      : "Todas las empresas";

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Empresas" }]}
        title={title}
        description="Busca y compara empresas verificadas de toda Espana. Filtra por sector y ubicacion."
        meta={<span>{formatCompact(result.total)} empresas encontradas</span>}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <form
          action="/empresas"
          method="get"
          className="bg-card flex flex-col gap-2 rounded-xl border p-2 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2.5 px-3">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar empresas, servicios o sectores..."
              className="placeholder:text-muted-foreground h-10 w-full bg-transparent text-sm outline-none"
            />
          </div>
          {ubicacion && (
            <input type="hidden" name="ubicacion" value={ubicacion} />
          )}
          {categoria && (
            <input type="hidden" name="categoria" value={categoria} />
          )}
          <Button type="submit" variant="brand">
            Buscar
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={makeHref({})}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              !categoria
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            Todas
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={makeHref({ categoria: category.slug })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                categoria === category.slug
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <CompanyGrid
            companies={result.items}
            emptyTitle="Sin resultados"
            emptyDescription="No hemos encontrado empresas con esos filtros. Prueba con otra busqueda."
          />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            makeHref={(p) => makeHref({ categoria, page: p })}
          />
        </div>
      </div>
    </>
  );
}
