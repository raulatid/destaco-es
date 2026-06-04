import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2 } from "lucide-react";

import { ClaimForm } from "@/components/claims/claim-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getCompanyClaimInfo } from "@/lib/data/companies";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyClaimInfo(slug);
  if (!company) return {};
  return buildMetadata({
    title: `Reclamar perfil de ${company.name}`,
    description: `Reclama y gestiona el perfil de ${company.name} en Destaco: edita datos, sube proyectos y responde reseñas.`,
    path: `/reclamar/${slug}`,
    noindex: true,
  });
}

export default async function ClaimPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyClaimInfo(slug);
  if (!company) notFound();

  const session = await auth();

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: company.name, href: `/empresa/${slug}` },
          { name: "Reclamar perfil" },
        ]}
        title={`Reclamar ${company.name}`}
        description="Verifica que gestionas esta empresa para editar su perfil, subir proyectos, responder reseñas y ver tus metricas."
        meta={
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            Gratis · Verificacion por email
          </span>
        }
      />

      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        {company.claimed ? (
          <div className="bg-card flex items-start gap-3 rounded-xl border p-6">
            <BadgeCheck className="text-primary size-5 shrink-0" />
            <div>
              <p className="font-medium">Este perfil ya tiene propietario</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Si crees que es un error, escribenos desde el correo corporativo
                de la empresa.
              </p>
            </div>
          </div>
        ) : !session?.user ? (
          <div className="bg-card rounded-xl border p-6 text-center">
            <p className="font-medium">Inicia sesion para reclamar</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Necesitas una cuenta de Destaco para reclamar y gestionar un
              perfil.
            </p>
            <Button asChild variant="brand" className="mt-4">
              <Link href={`/login?callbackUrl=/reclamar/${slug}`}>
                Iniciar sesion con Google
              </Link>
            </Button>
          </div>
        ) : (
          <ClaimForm companySlug={slug} companyName={company.name} />
        )}
      </div>
    </>
  );
}
