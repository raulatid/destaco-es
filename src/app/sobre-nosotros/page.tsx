import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { LEGAL, SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sobre nosotros",
  description:
    "Conoce Destaco.es, el directorio de empresas de España: nuestra mision, de donde salen los datos y nuestro compromiso con la informacion verificada.",
  path: "/sobre-nosotros",
});

const VALUES = [
  {
    icon: BadgeCheck,
    title: "Datos verificados",
    text: "Reunimos informacion de fuentes publicas y verificadas, y permitimos que cada empresa reclame y confirme su perfil.",
  },
  {
    icon: RefreshCw,
    title: "Actualizado a diario",
    text: "Ampliamos y revisamos el directorio cada dia para que siempre encuentres informacion util y al dia.",
  },
  {
    icon: Search,
    title: "Facil de comparar",
    text: "Organizamos las empresas por categoria, provincia y ciudad, con valoraciones y servicios claros.",
  },
  {
    icon: ShieldCheck,
    title: "Transparente",
    text: "Sin intermediarios ni comisiones ocultas. Contactas directamente con cada empresa.",
  },
];

export default function SobreNosotrosPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Inicio", href: "/" }, { name: "Sobre nosotros" }]}
        title="Sobre Destaco"
        description="Ayudamos a las personas a encontrar las mejores empresas de España y a los negocios a llegar a mas clientes."
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-muted-foreground space-y-4 leading-relaxed text-pretty">
          <p>
            {SITE.name} es un directorio de empresas de toda España. Nuestro
            objetivo es sencillo: que encontrar un buen profesional sea rapido,
            transparente y fiable. Reunimos miles de negocios organizados por
            categoria, provincia y ciudad, con valoraciones reales, servicios y
            datos de contacto para que puedas comparar y decidir con confianza.
          </p>
          <p>
            Creemos que las pequeñas y medianas empresas merecen visibilidad. Por
            eso cualquier negocio puede reclamar su perfil gratis, completar su
            informacion, subir proyectos y responder a sus clientes, sin
            intermediarios ni comisiones.
          </p>
        </div>

        <h2 className="mt-12 text-xl font-semibold tracking-tight sm:text-2xl">
          Nuestros principios
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {VALUES.map((value) => (
            <div key={value.title} className="bg-card rounded-xl border p-5">
              <div className="bg-muted text-foreground grid size-10 place-items-center rounded-lg border">
                <value.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">
                {value.title}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {value.text}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-semibold tracking-tight sm:text-2xl">
          ¿De donde salen los datos?
        </h2>
        <p className="text-muted-foreground mt-3 leading-relaxed text-pretty">
          Recopilamos la informacion de empresas a partir de fuentes publicas y
          verificadas, respetando la normativa de proteccion de datos. Cada
          empresa puede reclamar su ficha para corregir, completar o ampliar su
          informacion en cualquier momento. Si detectas un dato incorrecto,
          puedes avisarnos y lo revisaremos.
        </p>

        <h2 className="mt-12 text-xl font-semibold tracking-tight sm:text-2xl">
          Quien esta detras
        </h2>
        <p className="text-muted-foreground mt-3 leading-relaxed text-pretty">
          Destaco es un proyecto impulsado por {LEGAL.ownerName}. Trabajamos cada
          dia para mejorar el directorio y dar mas visibilidad a las empresas que
          destacan. ¿Tienes una propuesta o una duda?{" "}
          <Link
            href="/contacto"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Escribenos
          </Link>
          .
        </p>

        <div className="bg-card mt-12 flex flex-col items-start gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="text-muted-foreground size-5 shrink-0" />
            <p className="text-sm font-medium">
              ¿Tienes una empresa? Publicala o reclamala gratis.
            </p>
          </div>
          <Button asChild variant="brand">
            <Link href="/registro">Publicar mi empresa</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
