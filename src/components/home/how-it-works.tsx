import { BadgeCheck, MessagesSquare, Scale, Search, Sparkles } from "lucide-react";

import { Reveal } from "@/components/reveal";

const STEPS = [
  {
    icon: Search,
    title: "Busca",
    text: "Encuentra empresas por categoria, provincia o ciudad con un buscador inteligente y filtros avanzados.",
  },
  {
    icon: Scale,
    title: "Compara",
    text: "Revisa valoraciones reales, servicios, precios y perfiles enriquecidos con IA para decidir mejor.",
  },
  {
    icon: MessagesSquare,
    title: "Contacta",
    text: "Llama, escribe o solicita presupuesto al instante. Sin intermediarios ni comisiones ocultas.",
  },
];

const FEATURES = [
  { icon: BadgeCheck, label: "Datos verificados" },
  { icon: Sparkles, label: "Enriquecido con IA" },
  { icon: Search, label: "Busqueda semantica" },
  { icon: Scale, label: "Valoraciones reales" },
];

export function HowItWorks() {
  return (
    <section className="border-y">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            Simple y transparente
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Como funciona Destaco
          </h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            De la busqueda al contacto en tres pasos. Sin registros
            obligatorios.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.07}>
              <div className="bg-card relative h-full rounded-xl border p-6">
                <span className="text-muted-foreground/30 absolute top-5 right-6 text-4xl font-semibold tabular-nums">
                  0{i + 1}
                </span>
                <div className="bg-muted text-foreground grid size-11 place-items-center rounded-lg border">
                  <step.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-3 grid gap-4 rounded-xl border border-dashed p-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <feature.icon className="text-muted-foreground size-4 shrink-0" />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
