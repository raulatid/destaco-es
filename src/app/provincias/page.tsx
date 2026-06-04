import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { listProvinces } from "@/lib/data/locations";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatCompact } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Empresas por provincia",
  description:
    "Directorio de empresas de Espana organizado por provincia. Encuentra negocios verificados en las 52 provincias.",
  path: "/provincias",
});

export default async function ProvinciasPage() {
  const provinces = await listProvinces();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Provincias", path: "/provincias" },
        ])}
      />
      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Provincias" }]}
        title="Empresas por provincia"
        description="Explora el directorio por ubicacion y descubre las mejores empresas de cada provincia de Espana."
        meta={<span>{provinces.length} provincias</span>}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {provinces.map((province) => (
            <Link
              key={province.slug}
              href={`/provincias/${province.slug}`}
              className="group bg-card hover:border-foreground/20 flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 hover:shadow-md"
            >
              <div className="bg-muted text-muted-foreground group-hover:text-foreground grid size-10 shrink-0 place-items-center rounded-lg border transition-colors">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold tracking-tight">{province.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatCompact(province.companyCount)} empresas
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
