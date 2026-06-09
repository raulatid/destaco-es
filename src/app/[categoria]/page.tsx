import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin } from "lucide-react";

import { CompanyGrid } from "@/components/company-grid";
import { FaqSection } from "@/components/faq-section";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SortControl } from "@/components/sort-control";
import { CategoryIcon } from "@/components/category-icon";
import { getCategoryBySlug } from "@/lib/data/categories";
import { listCompanies } from "@/lib/data/companies";
import {
  bestNoun,
  categoryNoun,
  CATEGORY_PARENT,
  childCategories,
  nounIsFeminine,
  relatedCategories,
  TOP_CITIES,
} from "@/lib/constants";
import { isSortOption } from "@/lib/ranking";
import {
  breadcrumbJsonLd,
  buildMetadata,
  categoryFaqs,
  categoryIntro,
  faqJsonLd,
  itemListJsonLd,
} from "@/lib/seo";
import { MIN_ITEMS_FOR_INDEX } from "@/lib/seo/seo-pages";
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
  const noun = categoryNoun(categoria, category.name);
  return buildMetadata({
    title: category.metaTitle ?? `${bestNoun(noun)} en España`,
    description:
      category.metaDescription ??
      category.description ??
      `Directorio de ${bestNoun(noun, true)} en España. Compara valoraciones, servicios y precios y contacta gratis.`,
    path: `/${categoria}`,
    // Evita "thin content": categorias casi vacias no se indexan.
    noindex: (category.companyCount ?? 0) < MIN_ITEMS_FOR_INDEX,
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

  const noun = categoryNoun(categoria, category.name);
  const g = nounIsFeminine(noun) ? "a" : "o";
  const page = Math.max(1, Number(pageParam) || 1);
  const sort = isSortOption(sortParam) ? sortParam : "score";
  const result = await listCompanies({ categorySlug: categoria, page, sort });
  const subcategories = childCategories(categoria);
  const faqs = categoryFaqs(noun, result.total);
  const intro = categoryIntro({
    noun,
    count: result.total || category.companyCount,
    seedKey: categoria,
  });
  // Solo para subcategorias: enlaza hacia la madre y las hermanas (las de
  // primer nivel ya muestran sus nichos en "Especialidades").
  const related = CATEGORY_PARENT[categoria] ? relatedCategories(categoria, 10) : [];

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
          `${bestNoun(noun)} en España`,
        )}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: "Categorias", href: "/categorias" },
          { name: category.name },
        ]}
        title={`${bestNoun(noun)} en España`}
        description={
          category.description ??
          `${bestNoun(noun)} de España, verificad${g}s y valorad${g}s por clientes reales.`
        }
        meta={
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            {formatCompact(result.total || category.companyCount)} empresas
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="text-muted-foreground mb-10 max-w-3xl space-y-3 text-[15px] leading-relaxed">
          {intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>
        {subcategories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold tracking-tight">
              Especialidades de {noun}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Filtra por especialidad y encuentra justo lo que buscas.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/${sub.slug}`}
                  className="group bg-card hover:border-foreground/20 flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 hover:shadow-md"
                >
                  <div className="bg-muted text-muted-foreground group-hover:text-foreground grid size-9 shrink-0 place-items-center rounded-lg border transition-colors">
                    <CategoryIcon name={sub.icon} className="size-4" />
                  </div>
                  <span className="text-sm font-medium">{sub.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {result.items.length > 0 && (
          <div className="mb-6 flex justify-end">
            <SortControl value={sort} />
          </div>
        )}
        <CompanyGrid
          companies={result.items}
          emptyTitle={`Aun no hay ${noun} en el directorio`}
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

        <FaqSection
          faqs={faqs}
          title={`Preguntas frecuentes sobre ${noun}`}
          className="mt-16"
        />

        <section className="mt-16">
          <h2 className="text-xl font-semibold tracking-tight">
            {bestNoun(noun)} por ciudad
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Explora {bestNoun(noun, true)} en tu ciudad.
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
                  {noun} en {city.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold tracking-tight">
              Categorias relacionadas
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {related.map((rc) => (
                <Link
                  key={rc.slug}
                  href={`/${rc.slug}`}
                  className="border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                >
                  <CategoryIcon name={rc.icon} className="size-3.5 shrink-0" />
                  {rc.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
