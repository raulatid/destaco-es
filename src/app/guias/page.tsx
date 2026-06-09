import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import {
  categoryNoun,
  childCategories,
  TOP_LEVEL_CATEGORIES,
} from "@/lib/constants";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Guias para elegir y contratar empresas",
  description:
    "Guias practicas por sector: como elegir, cuanto cuesta y que errores evitar al contratar profesionales y empresas en España.",
  path: "/guias",
});

export default function GuiasPage() {
  const categories = TOP_LEVEL_CATEGORIES;
  const total = categories.reduce(
    (acc, c) => acc + 1 + childCategories(c.slug).length,
    0,
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Guias", path: "/guias" },
        ])}
      />
      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Guias" }]}
        title="Guias para contratar con acierto"
        description="Aprende a elegir el profesional adecuado en cada sector: que tener en cuenta, cuanto cuesta y como evitar los errores mas comunes."
        meta={<span>{total} guias por sector</span>}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {categories.map((category) => {
            const subs = childCategories(category.slug);
            return (
              <section
                key={category.slug}
                className="bg-card rounded-2xl border p-5 sm:p-6"
              >
                <Link
                  href={`/guias/${category.slug}`}
                  className="group flex min-w-0 items-start gap-4"
                >
                  <div className="bg-muted text-muted-foreground group-hover:text-foreground grid size-11 shrink-0 place-items-center rounded-lg border transition-colors">
                    <CategoryIcon name={category.icon} className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="group-hover:text-primary flex items-center gap-1.5 font-semibold tracking-tight transition-colors">
                      Como elegir {categoryNoun(category.slug, category.name)}
                      <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </h2>
                    {category.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {category.description}
                      </p>
                    )}
                  </div>
                </Link>

                {subs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 sm:pl-[60px]">
                    {subs.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/guias/${sub.slug}`}
                        className="border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                      >
                        <CategoryIcon
                          name={sub.icon}
                          className="size-3.5 shrink-0"
                        />
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
