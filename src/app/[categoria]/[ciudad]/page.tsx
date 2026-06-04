import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { CompanyGrid } from "@/components/company-grid";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SortControl } from "@/components/sort-control";
import { getCategoryBySlug } from "@/lib/data/categories";
import { listCompanies } from "@/lib/data/companies";
import { getCityBySlug } from "@/lib/data/locations";
import { TOP_CITIES } from "@/lib/constants";
import { isSortOption } from "@/lib/ranking";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  itemListJsonLd,
  landingDescription,
  landingFaqs,
  landingTitle,
} from "@/lib/seo";
import { MIN_ITEMS_FOR_INDEX } from "@/lib/seo/seo-pages";
import { formatCompact } from "@/lib/utils";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ categoria: string; ciudad: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categoria, ciudad } = await params;
  const [category, city] = await Promise.all([
    getCategoryBySlug(categoria),
    getCityBySlug(ciudad),
  ]);
  if (!category || !city) return {};

  // Contamos para decidir titulo, descripcion y si la pagina es indexable.
  const result = await listCompanies({
    categorySlug: categoria,
    citySlug: ciudad,
    page: 1,
  });

  return buildMetadata({
    title: landingTitle(category.name, city.name),
    description: landingDescription(category.name, city.name, result.total),
    path: `/${categoria}/${ciudad}`,
    // Evita "thin content": paginas con pocas empresas no se indexan.
    noindex: result.total < MIN_ITEMS_FOR_INDEX,
  });
}

export default async function CategoryCityPage({
  params,
  searchParams,
}: PageProps) {
  const { categoria, ciudad } = await params;
  const { page: pageParam, sort: sortParam } = await searchParams;
  const [category, city] = await Promise.all([
    getCategoryBySlug(categoria),
    getCityBySlug(ciudad),
  ]);
  if (!category || !city) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const sort = isSortOption(sortParam) ? sortParam : "score";
  const result = await listCompanies({
    categorySlug: categoria,
    citySlug: ciudad,
    page,
    sort,
  });

  const faqs = landingFaqs(
    category.name,
    city.name,
    result.total,
    result.items[0]?.name,
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Categorias", path: "/categorias" },
          { name: category.name, path: `/${categoria}` },
          { name: city.name, path: `/${categoria}/${ciudad}` },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          result.items.map((c) => ({
            name: c.name,
            path: `/empresa/${c.slug}`,
          })),
          landingTitle(category.name, city.name),
        )}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: "Categorias", href: "/categorias" },
          { name: category.name, href: `/${categoria}` },
          { name: city.name },
        ]}
        title={landingTitle(category.name, city.name)}
        description={`Las mejores empresas de ${category.name.toLowerCase()} en ${city.name}, provincia de ${city.province}. Verificadas y valoradas por clientes reales.`}
        meta={
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            {formatCompact(result.total)} empresas en {city.name}
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
          emptyTitle={`Aun no hay ${category.name.toLowerCase()} en ${city.name}`}
          emptyDescription="Estamos ampliando el directorio cada dia. Vuelve pronto o prueba en otra ciudad."
        />
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          makeHref={(p) => {
            const qs = new URLSearchParams();
            if (p > 1) qs.set("page", String(p));
            if (sort !== "score") qs.set("sort", sort);
            const query = qs.toString();
            return query
              ? `/${categoria}/${ciudad}?${query}`
              : `/${categoria}/${ciudad}`;
          }}
        />

        {faqs.length > 0 && (
          <section className="mt-16 max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight">
              Preguntas frecuentes sobre {category.name.toLowerCase()} en{" "}
              {city.name}
            </h2>
            <div className="mt-5 space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group bg-card rounded-xl border p-4"
                >
                  <summary className="cursor-pointer list-none font-medium">
                    {faq.question}
                  </summary>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <h2 className="text-xl font-semibold tracking-tight">
            {category.name} en otras ciudades
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {TOP_CITIES.filter((c) => c.slug !== ciudad).map((c) => (
              <Link
                key={c.slug}
                href={`/${categoria}/${c.slug}`}
                className="border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              >
                {category.name.split(" ")[0]} en {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
