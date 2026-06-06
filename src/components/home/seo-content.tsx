import Link from "next/link";

import { Reveal } from "@/components/reveal";
import { TOP_PROVINCES } from "@/lib/constants";

const chip =
  "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground rounded-full border px-3 py-1.5 text-sm transition-colors";

// Combinaciones nicho+ciudad muy buscadas: enlazan a landings indexables y
// refuerzan el enlazado interno hacia las paginas programaticas.
const POPULAR_SEARCHES = [
  { label: "Agencias de marketing en Madrid", href: "/marketing/madrid" },
  { label: "Abogados en Barcelona", href: "/abogados/barcelona" },
  { label: "Clinicas dentales en Valencia", href: "/dentistas/valencia" },
  { label: "Restaurantes en Sevilla", href: "/restaurantes/sevilla" },
  { label: "Reformas en Malaga", href: "/reformas/malaga" },
  { label: "Inmobiliarias en Madrid", href: "/inmobiliarias/madrid" },
  { label: "Gimnasios en Barcelona", href: "/fitness/barcelona" },
  { label: "Fotografos en Valencia", href: "/fotografia/valencia" },
  { label: "Peluquerias en Sevilla", href: "/peluquerias/sevilla" },
  { label: "Talleres mecanicos en Bilbao", href: "/automocion/bilbao" },
  { label: "Asesorias en Zaragoza", href: "/asesorias/zaragoza" },
  { label: "Veterinarios en Alicante", href: "/veterinarios/alicante" },
];

export function SeoContent() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              El directorio de empresas de España, en un solo lugar
            </h2>
            <div className="text-muted-foreground mt-5 space-y-4 leading-relaxed text-pretty">
              <p>
                En Destaco reunimos miles de empresas y profesionales de toda
                España, organizados por categoria, provincia y ciudad. Compara
                valoraciones reales, servicios, precios y datos de contacto para
                elegir con confianza, sin intermediarios ni comisiones ocultas.
              </p>
              <p>
                Tanto si buscas{" "}
                <Link
                  href="/abogados"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  abogados
                </Link>
                ,{" "}
                <Link
                  href="/dentistas"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  clinicas dentales
                </Link>
                ,{" "}
                <Link
                  href="/marketing"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  agencias de marketing
                </Link>
                ,{" "}
                <Link
                  href="/restaurantes"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  restaurantes
                </Link>{" "}
                o{" "}
                <Link
                  href="/reformas"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  reformas
                </Link>
                , encontraras las mejores opciones cerca de ti. Ampliamos el
                directorio a diario con fichas verificadas.
              </p>
              <p>
                ¿Tienes una empresa? Reclama tu perfil gratis para gestionar tu
                informacion y llegar a mas clientes, o destaca por encima del
                resto en tu sector con el plan Destacado.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {TOP_PROVINCES.map((p) => (
                <Link key={p.slug} href={`/provincias/${p.slug}`} className={chip}>
                  Empresas en {p.name}
                </Link>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="bg-card rounded-2xl border p-6 sm:p-8">
              <h3 className="text-lg font-semibold tracking-tight">
                Busquedas populares
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Accede directo a los listados mas buscados de España.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((item) => (
                  <Link key={item.href} href={item.href} className={chip}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
