import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Mail, MapPin } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { LEGAL, SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contacto",
  description:
    "¿Tienes una duda, una sugerencia o quieres corregir los datos de tu empresa? Ponte en contacto con el equipo de Destaco.es.",
  path: "/contacto",
});

export default function ContactoPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Contacto" }]}
        title="Contacto"
        description="Estamos aqui para ayudarte. Escribenos y te responderemos lo antes posible."
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${LEGAL.email}`}
            className="bg-card hover:border-foreground/20 flex items-start gap-3 rounded-xl border p-5 transition-colors"
          >
            <Mail className="text-muted-foreground mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground mt-0.5 text-sm break-all">
                {LEGAL.email}
              </p>
            </div>
          </a>

          <div className="bg-card flex items-start gap-3 rounded-xl border p-5">
            <MapPin className="text-muted-foreground mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">Direccion</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {LEGAL.address}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card mt-4 rounded-xl border p-6">
          <h2 className="font-semibold tracking-tight">Escribenos</h2>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            Para soporte, sugerencias o para corregir los datos de una empresa,
            mandanos un correo y te atenderemos personalmente.
          </p>
          <Button asChild variant="brand" className="mt-4">
            <a href={`mailto:${LEGAL.email}`}>
              <Mail className="size-4" />
              Enviar un email
            </a>
          </Button>
        </div>

        <div className="bg-card mt-4 flex flex-col items-start gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="text-muted-foreground size-5 shrink-0" />
            <p className="text-sm font-medium">
              ¿Es tu empresa? Reclama o publica tu perfil gratis.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/registro">Publicar empresa</Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-8 text-center text-xs">
          {SITE.name} — {LEGAL.ownerName}, NIF {LEGAL.nif}
        </p>
      </div>
    </>
  );
}
