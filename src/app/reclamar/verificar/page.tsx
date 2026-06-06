import Link from "next/link";
import { BadgeCheck, Clock, XCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { verifyClaim, type VerifyClaimResult } from "@/lib/actions/claims";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Verificacion de reclamacion",
  path: "/reclamar/verificar",
  noindex: true,
});

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyClaimPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  // verifyClaim hace escrituras en BD; un blip transitorio no debe tumbar la
  // pagina con una excepcion en bruto. Lo capturamos y mostramos un aviso.
  let result: VerifyClaimResult | { status: "error" };
  try {
    result = await verifyClaim(token ?? "");
  } catch (err) {
    console.error("[verify-claim] fallo al verificar el token:", err);
    result = { status: "error" };
  }

  const fallback = {
    icon: <XCircle className="text-destructive size-12" />,
    title: "Enlace no valido",
    body: "Este enlace de verificacion no es valido o ya se ha usado.",
    cta: { href: "/", label: "Volver al inicio" },
  };

  const content =
    {
      approved: {
        icon: <BadgeCheck className="text-success size-12" />,
        title: "Reclamacion aprobada",
        body:
          "companyName" in result
            ? `Ya gestionas ${result.companyName}. Accede a tu panel para editar el perfil, subir proyectos y responder reseñas.`
            : "",
        cta: { href: "/dashboard", label: "Ir a mi panel" },
      },
      pending: {
        icon: <Clock className="text-primary size-12" />,
        title: "Email verificado — pendiente de revision",
        body:
          "companyName" in result
            ? `Hemos verificado tu email para ${result.companyName}. Como no procede de un dominio corporativo coincidente, nuestro equipo revisara la reclamacion en breve.`
            : "",
        cta: { href: "/", label: "Volver al inicio" },
      },
      expired: {
        icon: <XCircle className="text-destructive size-12" />,
        title: "El enlace ha caducado",
        body: "El enlace de verificacion ha expirado. Vuelve a iniciar la reclamacion del perfil.",
        cta: { href: "/", label: "Volver al inicio" },
      },
      invalid: fallback,
      error: {
        icon: <XCircle className="text-destructive size-12" />,
        title: "No hemos podido verificar el enlace",
        body: "Ha ocurrido un problema temporal al procesar la verificacion. Vuelve a abrir el enlace del correo en unos minutos; si persiste, reinicia la reclamacion del perfil.",
        cta: { href: "/", label: "Volver al inicio" },
      },
    }[result.status] ?? fallback;

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Inicio", href: "/" },
          { name: "Reclamacion de perfil" },
        ]}
        title="Verificacion de reclamacion"
      />
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <div className="flex justify-center">{content.icon}</div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          {content.title}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {content.body}
        </p>
        <Button asChild variant="brand" className="mt-6">
          <Link href={content.cta.href}>{content.cta.label}</Link>
        </Button>
      </div>
    </>
  );
}
