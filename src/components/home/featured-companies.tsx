import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CompanyCard } from "@/components/company-card";
import { Reveal } from "@/components/reveal";
import { getFeaturedCompanies } from "@/lib/data/companies";

export async function FeaturedCompanies() {
  const companies = await getFeaturedCompanies(9);

  return (
    <section className="bg-muted/40 border-y">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              Las mejor valoradas
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Empresas destacadas
            </h2>
          </div>
          <Link
            href="/empresas"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium"
          >
            Explorar todas
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company, i) => (
            <Reveal key={company.slug} delay={(i % 3) * 0.06}>
              <CompanyCard company={company} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
