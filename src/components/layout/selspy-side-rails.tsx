import { AppWindow, ArrowRight, Megaphone, Rocket, TrendingUp } from "lucide-react";

/**
 * Anuncios laterales (skyscraper) de Selspy, fijos a izquierda y derecha.
 *
 * Solo se muestran en monitores anchos: el contenido del sitio es max-w-7xl
 * (1280px) centrado, asi que los railes solo caben en el margen sobrante sin
 * tapar contenido. Por debajo de ~1760px de viewport se ocultan (min-[1760px]).
 * Todo el anuncio es un enlace a selspy.es.
 */

const FEATURES = [
  { icon: TrendingUp, label: "Analiza tu SEO" },
  { icon: AppWindow, label: "Crea webs y tiendas" },
  { icon: Megaphone, label: "Automatiza marketing" },
] as const;

function SelspyAdCard() {
  return (
    <a
      href="https://selspy.es"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Publicidad de Selspy: convierte visitas en clientes con IA. Probar Selspy gratis."
      className="group block w-full overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-b from-[#1a1512] to-[#0a0807] p-4 text-white shadow-[0_0_50px_-16px_rgba(249,115,22,0.55)] transition-shadow hover:shadow-[0_0_64px_-10px_rgba(249,115,22,0.8)]"
    >
      <div aria-hidden>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
            <Rocket className="size-4 text-black" />
          </span>
          <span className="text-lg font-bold tracking-tight">Selspy</span>
        </div>

        {/* Badge */}
        <span className="mt-3 inline-block rounded-full border border-orange-500/40 px-3 py-1 text-[11px] font-semibold text-orange-400">
          IA para negocios
        </span>

        {/* Headline */}
        <h3 className="mt-3 text-[22px] leading-[1.1] font-extrabold tracking-tight">
          Convierte visitas en{" "}
          <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            clientes
          </span>
        </h3>

        <p className="mt-2 text-[12px] leading-snug text-white/65">
          Webs, SEO, automatizaciones y ventas desde un solo chat.
        </p>

        {/* Features */}
        <ul className="mt-4 space-y-2.5">
          {FEATURES.map((f) => (
            <li key={f.label} className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-orange-500/40 text-orange-400">
                <f.icon className="size-4" />
              </span>
              <span className="text-[13px] font-medium">{f.label}</span>
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
          <div>
            <p className="text-[10px] text-white/50">Visitas</p>
            <p className="text-[13px] font-bold">12.4K</p>
            <p className="text-[10px] font-medium text-emerald-400">+18.6%</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50">Ventas</p>
            <p className="text-[13px] font-bold">842</p>
            <p className="text-[10px] font-medium text-emerald-400">+23.4%</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50">SEO</p>
            <p className="text-[13px] font-bold">86</p>
            <p className="text-[10px] font-medium text-orange-400">Excelente</p>
          </div>
        </div>

        {/* CTA */}
        <span className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-[0_8px_24px_-8px_rgba(249,115,22,0.85)] transition-transform group-hover:scale-[1.02]">
          Probar Selspy
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
        <p className="mt-2 text-center text-[11px] text-white/45">Empieza gratis</p>
      </div>
    </a>
  );
}

export function SelspySideRails() {
  return (
    <>
      <aside className="fixed top-1/2 left-4 z-40 hidden w-52 -translate-y-1/2 min-[1760px]:block">
        <p className="text-muted-foreground/70 mb-1.5 text-center text-[10px] tracking-wider uppercase">
          Publicidad
        </p>
        <SelspyAdCard />
      </aside>
      <aside className="fixed top-1/2 right-4 z-40 hidden w-52 -translate-y-1/2 min-[1760px]:block">
        <p className="text-muted-foreground/70 mb-1.5 text-center text-[10px] tracking-wider uppercase">
          Publicidad
        </p>
        <SelspyAdCard />
      </aside>
    </>
  );
}
