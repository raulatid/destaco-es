import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { CompanyGrid } from "@/components/company-grid";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { listCompanies } from "@/lib/data/companies";
import { getProvinceBySlug, listCitiesInProvince } from "@/lib/data/locations";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { formatCompact } from "@/lib/utils";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ provincia: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { provincia } = await params;
  const province = await getProvinceBySlug(provincia);
  if (!province) return {};
  return buildMetadata({
    title:
      province.metaTitle ?? `Empresas en la provincia de ${province.name}`,
    description:
      province.metaDescription ??
      `Directorio de empresas en ${province.name}. Encuentra negocios verificados por ciudad y categoria.`,
    path: `/provincias/${provincia}`,
  });
}

export default async function ProvincePage({
  params,
  searchParams,
}: PageProps) {
  const { provincia } = await params;
  const { page: pageParam } = await searchParams;
  const province = await getProvinceBySlug(provincia);
  if (!province) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const [result, cities] = await Promise.all([
    listCompanies({ provinceSlug: provincia, page }),
    listCitiesInProvince(provincia),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Provincias", path: "/provincias" },
          { name: province.name, path: `/provincias/${provincia}` },
        ])}
      />
      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: "Provincias", href: "/provincias" },
          { name: province.name },
        ]}
        title={`Empresas en ${province.name}`}
        description={`Las mejores empresas de la provincia de ${province.name}${
          province.autonomousCommunity
            ? ` (${province.autonomousCommunity})`
            : ""
        }, verificadas y valoradas.`}
        meta={
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            {formatCompact(result.total || province.companyCount)} empresas
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {cities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold tracking-tight">
              Ciudades de {province.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/empresas?ubicacion=${city.slug}`}
                  className="border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <h2 className="mb-5 text-xl font-semibold tracking-tight">
          Empresas destacadas en {province.name}
        </h2>
        <CompanyGrid
          companies={result.items}
          emptyTitle={`Aun no hay empresas en ${province.name}`}
          emptyDescription="Estamos ampliando el directorio. Conecta la base de datos y ejecuta la ingesta para llenar esta provincia."
        />
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          makeHref={(p) =>
            p === 1
              ? `/provincias/${provincia}`
              : `/provincias/${provincia}?page=${p}`
          }
        />
      </div>
    </>
  );
}
