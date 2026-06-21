import { Reveal } from "@/components/reveal";

/**
 * Banda de logos "han sido contratadas por": marquee horizontal infinito con
 * logos monocromos de marcas mundialmente reconocidas. Los SVG viven en
 * `public/logos/` (negros, `#000000`) y se invierten a blanco en modo oscuro.
 *
 * El marquee es continuo: duplicamos la lista y la pista se desplaza -50% con
 * la animacion `animate-marquee`, de modo que el bucle es perfecto.
 */
const LOGOS = [
  { slug: "google", name: "Google" },
  { slug: "meta", name: "Meta" },
  { slug: "samsung", name: "Samsung" },
  { slug: "netflix", name: "Netflix" },
  { slug: "spotify", name: "Spotify" },
  { slug: "paypal", name: "PayPal" },
  { slug: "nvidia", name: "NVIDIA" },
  { slug: "tesla", name: "Tesla" },
  { slug: "airbnb", name: "Airbnb" },
  { slug: "uber", name: "Uber" },
  { slug: "sony", name: "Sony" },
  { slug: "visa", name: "Visa" },
  { slug: "mastercard", name: "Mastercard" },
  { slug: "nike", name: "Nike" },
  { slug: "bmw", name: "BMW" },
] as const;

const EDGE_FADE =
  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)";

export function TrustedByMarquee() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-muted-foreground text-center text-xs font-medium tracking-wider uppercase">
          Empresas de Destaco han sido contratadas por
        </p>
        <div
          className="group relative mt-7 overflow-hidden"
          style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
        >
          <div className="flex w-max animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused] sm:gap-16 sm:pr-16">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${logo.slug}-${i}`}
                src={`/logos/${logo.slug}.svg`}
                alt={logo.name}
                loading="lazy"
                className="h-6 w-auto shrink-0 opacity-50 grayscale transition-opacity duration-300 group-hover:opacity-70 sm:h-7 dark:invert"
              />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
