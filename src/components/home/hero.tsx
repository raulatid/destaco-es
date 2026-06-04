import Link from "next/link";
import { Building2, MapPin, Sparkles, Tags } from "lucide-react";

import { SearchBar } from "@/components/home/search-bar";
import { getSiteStats } from "@/lib/data/stats";
import { formatCompact } from "@/lib/utils";

const POPULAR = [
  { label: "Marketing en Madrid", href: "/marketing/madrid" },
  { label: "Abogados en Barcelona", href: "/abogados/barcelona" },
  { label: "Dentistas en Valencia", href: "/dentistas/valencia" },
  { label: "Restaurantes en Sevilla", href: "/restaurantes/sevilla" },
];

export async function Hero() {
  const stats = await getSiteStats();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="dotted-bg absolute inset-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 65% 55% at 50% 0%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 55% at 50% 0%, black, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 lg:px-8">
        <Link
          href="/blog/directorio-con-ia"
          className="border-border bg-card text-muted-foreground hover:text-foreground mx-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
        >
          <Sparkles className="size-3.5" />
          Enriquecido con IA · Actualizado a diario
        </Link>

        <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          El directorio de empresas que Espana necesitaba
        </h1>

        <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-pretty">
          Miles de negocios verificados, valorados y enriquecidos con IA. Busca
          por categoria, provincia o ciudad y contacta al instante.
        </p>

        <div className="mt-9">
          <SearchBar />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-muted-foreground text-sm">Populares:</span>
          {POPULAR.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3 py-1 text-sm transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
          <span className="flex items-center gap-2">
            <Building2 className="size-4" />
            <strong className="text-foreground font-semibold">
              {formatCompact(stats.companies)}
            </strong>{" "}
            empresas
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="size-4" />
            <strong className="text-foreground font-semibold">
              {formatCompact(stats.cities)}
            </strong>{" "}
            ciudades
          </span>
          <span className="flex items-center gap-2">
            <Tags className="size-4" />
            <strong className="text-foreground font-semibold">
              {formatCompact(stats.categories)}
            </strong>{" "}
            categorias
          </span>
        </div>
      </div>
    </section>
  );
}
