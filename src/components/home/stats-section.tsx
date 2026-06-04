import { Building2, Map, MapPin, Tags } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { getSiteStats } from "@/lib/data/stats";
import { formatCompact } from "@/lib/utils";

export async function StatsSection() {
  const stats = await getSiteStats();

  const items = [
    { icon: Building2, value: stats.companies, label: "Empresas publicadas" },
    { icon: MapPin, value: stats.cities, label: "Ciudades" },
    { icon: Map, value: stats.provinces, label: "Provincias" },
    { icon: Tags, value: stats.categories, label: "Categorias" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
      <Reveal>
        <div className="grid divide-y rounded-xl border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {items.map((stat) => (
            <div key={stat.label} className="p-7">
              <stat.icon className="text-muted-foreground size-5" />
              <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {formatCompact(stat.value)}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
