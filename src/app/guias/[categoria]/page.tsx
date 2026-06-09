import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { FaqSection } from "@/components/faq-section";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug } from "@/lib/data/categories";
import {
  bestNoun,
  categoryNoun,
  childCategories,
  nounIsFeminine,
  TOP_CITIES,
} from "@/lib/constants";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
} from "@/lib/seo";
import { categoryGuide } from "@/lib/seo/guides";
import { formatCompact } from "@/lib/utils";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ categoria: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) return {};
  const noun = categoryNoun(categoria, category.name);
  const guide = categoryGuide({
    slug: categoria,
    noun,
    description: category.description,
    count: category.companyCount,
    specialties: childCategories(categoria).map((c) => c.name),
  });
  return buildMetadata({
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: `/guias/${categoria}`,
  });
}

export default async function GuidePage({ params }: PageProps) {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  const noun = categoryNoun(categoria, category.name);
  const g = nounIsFeminine(noun) ? "a" : "o";
  const children = childCategories(categoria);
  const guide = categoryGuide({
    slug: categoria,
    noun,
    description: category.description,
    count: category.companyCount,
    specialties: children.map((c) => c.name),
  });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Guias", path: "/guias" },
          { name: category.name, path: `/guias/${categoria}` },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          title: guide.title,
          description: guide.metaDescription,
          path: `/guias/${categoria}`,
        })}
      />
      <JsonLd data={faqJsonLd(guide.faqs)} />

      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: "Guias", href: "/guias" },
          { name: category.name },
        ]}
        title={guide.title}
        description={`Guia practica para elegir y contratar ${bestNoun(noun, true)} con garantias.`}
        meta={
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-4" />
            Guia actualizada en {new Date().getFullYear()}
          </span>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="space-y-12">
          <section className="text-muted-foreground space-y-4 text-[15px] leading-relaxed">
            {guide.intro.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>

          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold tracking-tight">
                {section.heading}
              </h2>
              <div className="text-muted-foreground mt-3 space-y-3 text-[15px] leading-relaxed">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              {section.bullets && (
                <ul className="mt-4 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.term} className="bg-card rounded-xl border p-4">
                      <span className="font-medium">{bullet.term}.</span>{" "}
                      <span className="text-muted-foreground">
                        {bullet.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {children.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">
                Explora cada especialidad
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {children.map((sub) => (
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

          <FaqSection
            faqs={guide.faqs}
            title={`Preguntas frecuentes sobre ${noun}`}
          />

          <section className="bg-card rounded-2xl border p-6 text-center sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">
              Compara {noun} y contacta gratis
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm">
              Ya conoces las claves. Elige entre{" "}
              {category.companyCount > 0
                ? `${formatCompact(category.companyCount)} `
                : ""}
              {noun} verificad{g}s de toda España, compara sus valoraciones y
              contacta sin intermediarios.
            </p>
            <Button asChild className="mt-5">
              <Link href={`/${categoria}`}>
                Ver {bestNoun(noun, true)}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              {bestNoun(noun)} por ciudad
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOP_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/${categoria}/${city.slug}`}
                  className="border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                >
                  {noun} en {city.name}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </>
  );
}
