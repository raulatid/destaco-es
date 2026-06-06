import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { CompanyGrid } from "@/components/company-grid";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { listCategories } from "@/lib/data/categories";
import { listCompanies } from "@/lib/data/companies";
import { getProvinceBySlug, listCitiesInProvince } from "@/lib/data/locations";
import { bestNoun, categoryNoun, nounIsFeminine } from "@/lib/constants";
import {
  breadcrumbJsonLd,
  buildMetadata,
  itemListJsonLd,
} from "@/lib/seo";
import { MIN_ITEMS_FOR_INDEX } from "@/lib/seo/seo-pages";
import { cn, formatCompact } from "@/lib/utils";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ provincia: string }>;
  searchParams: Promise<{ page?: string; categoria?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { provincia } = await params;
  const { categoria } = await searchParams;
  const province = await getProvinceBySlug(provincia);
  if (!province) return {};

  if (categoria) {
    const cat = (await listCategories()).find((c) => c.slug === categoria);
    if (cat) {
      const noun = categoryNoun(categoria, cat.name);
      return buildMetadata({
        title: `${bestNoun(noun)} en ${province.name}`,
        description: `Directorio de ${bestNoun(noun, true)} en la provincia de ${province.name}: valoraciones, opiniones reales y datos de contacto.`,
        path: `/provincias/${provincia}?categoria=${categoria}`,
        // Vista filtrada: duplica las landings /[categoria]/[ciudad]. No indexar.
        noindex: true,
      });
    }
  }

  return buildMetadata({
    title: province.metaTitle ?? `Empresas en la provincia de ${province.name}`,
    description:
      province.metaDescription ??
      `Directorio de empresas en ${province.name}. Filtra por categoria y ciudad y encuentra negocios verificados.`,
    path: `/provincias/${provincia}`,
    // Evita "thin content": provincias casi vacias no se indexan.
    noindex: (province.companyCount ?? 0) < MIN_ITEMS_FOR_INDEX,
  });
}

export default async function ProvincePage({
  params,
  searchParams,
}: PageProps) {
  const { provincia } = await params;
  const { page: pageParam, categoria } = await searchParams;
  const province = await getProvinceBySlug(provincia);
  if (!province) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const [result, cities, categories] = await Promise.all([
    listCompanies({ provinceSlug: provincia, categorySlug: categoria, page }),
    listCitiesInProvince(provincia),
    listCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === categoria);
  const noun = activeCategory
    ? categoryNoun(activeCategory.slug, activeCategory.name)
    : null;
  const g = noun && nounIsFeminine(noun) ? "a" : "o";

  const makeHref = (target: { categoria?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (target.categoria) qs.set("categoria", target.categoria);
    if (target.page && target.page > 1) qs.set("page", String(target.page));
    const query = qs.toString();
    return query ? `/provincias/${provincia}?${query}` : `/provincias/${provincia}`;
  };

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Provincias", path: "/provincias" },
          { name: province.name, path: `/provincias/${provincia}` },
        ])}
      />
      {result.items.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            result.items.map((c) => ({
              name: c.name,
              path: `/empresa/${c.slug}`,
            })),
            noun
              ? `${bestNoun(noun)} en ${province.name}`
              : `Empresas en ${province.name}`,
          )}
        />
      )}
      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: "Provincias", href: "/provincias" },
          { name: province.name },
        ]}
        title={
          noun
            ? `${bestNoun(noun)} en ${province.name}`
            : `Empresas en ${province.name}`
        }
        description={
          noun
            ? `${bestNoun(noun)} de la provincia de ${province.name}, verificad${g}s y valorad${g}s por clientes reales.`
            : `Las mejores empresas de la provincia de ${province.name}${
                province.autonomousCommunity
                  ? ` (${province.autonomousCommunity})`
                  : ""
              }, verificadas y valoradas.`
        }
        meta={
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            {formatCompact(result.total || province.companyCount)} empresas
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Filtro por categoria */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold tracking-tight">
            Filtra por categoria
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
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
        </section>

        {cities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold tracking-tight">
              Ciudades de {province.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={
                    activeCategory
                      ? `/${activeCategory.slug}/${city.slug}`
                      : `/empresas?ubicacion=${city.slug}`
                  }
                  className="border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                >
                  {activeCategory ? `${noun} en ${city.name}` : city.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <h2 className="mb-5 text-xl font-semibold tracking-tight">
          {noun
            ? `${bestNoun(noun)} en ${province.name}`
            : `Empresas destacadas en ${province.name}`}
        </h2>
        <CompanyGrid
          companies={result.items}
          emptyTitle={
            noun
              ? `Aun no hay ${noun} en ${province.name}`
              : `Aun no hay empresas en ${province.name}`
          }
          emptyDescription="Estamos ampliando el directorio cada dia. Prueba con otra categoria o vuelve pronto."
        />
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          makeHref={(p) => makeHref({ categoria, page: p })}
        />
      </div>
    </>
  );
}
