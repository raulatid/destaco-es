import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { CompanyGrid } from "@/components/company-grid";
import { FaqSection } from "@/components/faq-section";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SortControl } from "@/components/sort-control";
import { getCategoryBySlug } from "@/lib/data/categories";
import { listCompanies } from "@/lib/data/companies";
import { getCityBySlug } from "@/lib/data/locations";
import {
  bestNoun,
  categoryNoun,
  nounIsFeminine,
  relatedCategories,
  TOP_CITIES,
} from "@/lib/constants";
import { isSortOption } from "@/lib/ranking";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  itemListJsonLd,
  landingDescription,
  landingFaqs,
  landingIntro,
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

  const noun = categoryNoun(categoria, category.name);

  return buildMetadata({
    title: landingTitle(noun, city.name),
    description: landingDescription(noun, city.name, result.total),
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

  const noun = categoryNoun(categoria, category.name);
  const g = nounIsFeminine(noun) ? "a" : "o";
  const faqs = landingFaqs(noun, city.name, result.total, result.items[0]?.name);
  const intro = landingIntro({
    noun,
    cityName: city.name,
    provinceName: city.province,
    count: result.total,
    topName: result.items[0]?.name,
    seedKey: `${categoria}/${ciudad}`,
  });
  const related = relatedCategories(categoria, 8);

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
          landingTitle(noun, city.name),
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
        title={landingTitle(noun, city.name)}
        description={`${bestNoun(noun)} en ${city.name}, provincia de ${city.province}. Verificad${g}s y valorad${g}s por clientes reales.`}
        meta={
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            {formatCompact(result.total)} empresas en {city.name}
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="text-muted-foreground mb-10 max-w-3xl space-y-3 text-[15px] leading-relaxed">
          {intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>
        {result.items.length > 0 && (
          <div className="mb-6 flex justify-end">
            <SortControl value={sort} />
          </div>
        )}
        <CompanyGrid
          companies={result.items}
          emptyTitle={`Aun no hay ${noun} en ${city.name}`}
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

        <FaqSection
          faqs={faqs}
          title={`Preguntas frecuentes sobre ${noun} en ${city.name}`}
          className="mt-16"
        />

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold tracking-tight">
              Otros servicios en {city.name}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {related.map((rc) => (
                <Link
                  key={rc.slug}
                  href={`/${rc.slug}/${ciudad}`}
                  className="border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                >
                  {categoryNoun(rc.slug, rc.name)} en {city.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <h2 className="text-xl font-semibold tracking-tight">
            {bestNoun(noun)} en otras ciudades
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {TOP_CITIES.filter((c) => c.slug !== ciudad).map((c) => (
              <Link
                key={c.slug}
                href={`/${categoria}/${c.slug}`}
                className="border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              >
                {noun} en {c.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="text-muted-foreground mt-12 text-sm">
          Tambien puedes consultar{" "}
          <Link
            href={`/${categoria}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {bestNoun(noun, true)} en toda España
          </Link>{" "}
          o el directorio de{" "}
          <Link
            href={`/provincias/${city.provinceSlug}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            empresas en {city.province}
          </Link>
          .
        </section>
      </div>
    </>
  );
}
