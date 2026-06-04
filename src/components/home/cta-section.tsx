import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, Sparkles } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

const PERKS = [
  { icon: BadgeCheck, text: "Reclama y verifica tu perfil gratis" },
  { icon: Sparkles, text: "Perfil enriquecido y optimizado con IA" },
  { icon: BarChart3, text: "Estadisticas y leads de clientes reales" },
];

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="bg-card relative overflow-hidden rounded-2xl border p-8 sm:p-12">
          <div
            aria-hidden
            className="dotted-bg absolute inset-0"
            style={{
              maskImage:
                "radial-gradient(ellipse 50% 80% at 100% 50%, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 50% 80% at 100% 50%, black, transparent)",
            }}
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Tienes una empresa? Destaca en Destaco.
              </h2>
              <p className="text-muted-foreground mt-3 text-pretty">
                Aparece ante miles de clientes que buscan tus servicios cada
                dia. Crear o reclamar tu perfil es gratis.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="brand" size="lg">
                  <Link href="/registro">
                    Publicar mi empresa
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/precios">Ver planes</Link>
                </Button>
              </div>
            </div>

            <ul className="space-y-2.5">
              {PERKS.map((perk) => (
                <li
                  key={perk.text}
                  className="bg-background flex items-center gap-3 rounded-lg border p-3.5"
                >
                  <div className="bg-muted text-foreground grid size-9 shrink-0 place-items-center rounded-md border">
                    <perk.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">{perk.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
