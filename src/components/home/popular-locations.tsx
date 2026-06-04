import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { listProvinces } from "@/lib/data/locations";
import { formatCompact } from "@/lib/utils";

export async function PopularLocations() {
  const provinces = (await listProvinces())
    .filter((p) => p.companyCount > 0)
    .sort((a, b) => b.companyCount - a.companyCount)
    .slice(0, 8);

  if (provinces.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            Cobertura nacional
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Empresas por provincia
          </h2>
        </div>
        <Link
          href="/provincias"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
        >
          Ver todas las provincias
          <ArrowRight className="size-4" />
        </Link>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {provinces.map((province, i) => (
          <Reveal key={province.slug} delay={(i % 4) * 0.05}>
            <Link
              href={`/provincias/${province.slug}`}
              className="group bg-card hover:border-foreground/20 flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 hover:shadow-md"
            >
              <div className="bg-muted text-muted-foreground group-hover:text-foreground grid size-10 shrink-0 place-items-center rounded-lg border transition-colors">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold tracking-tight">{province.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatCompact(province.companyCount)}{" "}
                  {province.companyCount === 1 ? "empresa" : "empresas"}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
