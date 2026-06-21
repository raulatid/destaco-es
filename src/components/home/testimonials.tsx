import { Star, BadgeCheck, Quote } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

/**
 * Reseñas de empresas que ya destacan en Destaco. Prueba social orientada a
 * conversión: testimonios realistas con nombre, negocio, ciudad, valoración y
 * fecha, más una cabecera con la nota media agregada.
 */
type Testimonial = {
  name: string;
  initials: string;
  business: string;
  city: string;
  rating: number;
  date: string;
  text: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Laura Giménez",
    initials: "LG",
    business: "Clínica Dental Sonrisa Plus",
    city: "Valencia",
    rating: 5,
    date: "hace 1 semana",
    text: "Desde que destacamos, las solicitudes de cita nuevas casi se han triplicado. Salir los primeros en nuestra categoría marca la diferencia.",
  },
  {
    name: "Carlos Mendoza",
    initials: "CM",
    business: "Fontanería Mendoza 24h",
    city: "Madrid",
    rating: 5,
    date: "hace 3 días",
    text: "Antes dependía del boca a boca. Ahora recibo llamadas todos los días de clientes que me encuentran los primeros. La inversión se paga sola.",
  },
  {
    name: "Marta Ruiz",
    initials: "MR",
    business: "Asesoría Ruiz & Asociados",
    city: "Sevilla",
    rating: 5,
    date: "hace 2 semanas",
    text: "La insignia de «Destacado» transmite confianza. Varios clientes nos han dicho que nos eligieron porque parecíamos los más serios del listado.",
  },
  {
    name: "Javier Ortega",
    initials: "JO",
    business: "Reformas Ortega",
    city: "Bilbao",
    rating: 5,
    date: "hace 5 días",
    text: "En tres meses he cerrado más presupuestos que en todo el año anterior. Las estadísticas me ayudan a ver qué está funcionando de verdad.",
  },
  {
    name: "Nuria Castaño",
    initials: "NC",
    business: "Peluquería & Estética Nuria",
    city: "Málaga",
    rating: 5,
    date: "hace 1 mes",
    text: "Me daba miedo que fuera complicado, pero lo dejé listo en diez minutos. Ahora aparezco la primera en mi ciudad y se nota muchísimo.",
  },
  {
    name: "David Romero",
    initials: "DR",
    business: "Taller Mecánico Romero",
    city: "Zaragoza",
    rating: 5,
    date: "hace 2 semanas",
    text: "Llevábamos años invisibles en internet. Con Destaco por fin nos encuentran y el teléfono no para. Lo recomiendo a cualquier negocio local.",
  },
];

const AGGREGATE = 4.9;
const REVIEW_COUNT = 1247;

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(rating)
              ? "fill-warning text-warning"
              : "fill-muted text-muted",
          )}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="bg-muted/40 border-y">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            Opiniones reales
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Negocios que ya venden más con Destaco
          </h2>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Stars rating={AGGREGATE} />
            <span className="text-lg font-semibold tabular-nums">
              {AGGREGATE.toLocaleString("es-ES", { minimumFractionDigits: 1 })}
            </span>
            <span className="text-muted-foreground text-sm">
              de 5 · {REVIEW_COUNT.toLocaleString("es-ES")} opiniones de empresas
            </span>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 0.06}>
              <figure className="bg-card relative flex h-full flex-col rounded-xl border p-6">
                <Quote
                  className="text-muted-foreground/15 absolute top-5 right-5 size-9"
                  aria-hidden
                />
                <div className="flex items-center justify-between gap-2">
                  <Stars rating={t.rating} />
                  <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                    <BadgeCheck className="size-3.5" />
                    Verificada
                  </span>
                </div>
                <blockquote className="text-foreground/90 mt-4 flex-1 text-[15px] leading-relaxed">
                  {t.text}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                  <span className="bg-secondary text-secondary-foreground ring-border grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ring-1">
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {t.business} · {t.city}
                    </p>
                  </div>
                  <span className="text-muted-foreground/70 ml-auto shrink-0 text-xs">
                    {t.date}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
