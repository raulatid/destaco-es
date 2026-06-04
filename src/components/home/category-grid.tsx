import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { Reveal } from "@/components/reveal";
import { listCategories } from "@/lib/data/categories";
import { formatCompact } from "@/lib/utils";

export async function CategoryGrid() {
  const categories = await listCategories();

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            Explora por sector
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Categorias destacadas
          </h2>
        </div>
        <Link
          href="/categorias"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
        >
          Ver todas las categorias
          <ArrowRight className="size-4" />
        </Link>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, i) => (
          <Reveal key={category.slug} delay={i * 0.03}>
            <Link
              href={`/${category.slug}`}
              className="group bg-card hover:border-foreground/20 flex h-full items-start gap-4 rounded-xl border p-5 transition-all duration-300 hover:shadow-md"
            >
              <div className="bg-muted text-muted-foreground group-hover:text-foreground grid size-11 shrink-0 place-items-center rounded-lg border transition-colors">
                <CategoryIcon name={category.icon} className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold tracking-tight">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {category.description}
                  </p>
                )}
                <p className="text-muted-foreground/80 mt-2 text-xs font-medium">
                  {formatCompact(category.companyCount)}{" "}
                  {category.companyCount === 1 ? "empresa" : "empresas"}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
