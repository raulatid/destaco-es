import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Pasa null para renderizar el logo sin enlace. */
  href?: string | null;
}

/**
 * Logo de marca (public/logo.png): wordmark "Destaco" con el astronauta en la
 * luna como "c". En modo oscuro se invierte con hue-rotate para conservar los
 * colores de la luna y el cohete mientras el texto pasa a blanco.
 */
export function Logo({ className, href = "/" }: LogoProps) {
  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Destaco"
      width={666}
      height={126}
      className={cn(
        // max-w-none: anula el max-width:100% del preflight; sin el, cuando el
        // header va justo de sitio el flex encoge el enlace y el logo se
        // aplasta. shrink-0 evita que el propio img ceda como flex item.
        "h-8 w-auto max-w-none shrink-0 dark:invert dark:hue-rotate-180 dark:saturate-150 dark:brightness-110",
        className,
      )}
    />
  );

  if (href === null) return mark;

  return (
    <Link
      href={href}
      aria-label="Destaco.es — inicio"
      className="shrink-0 transition-opacity hover:opacity-70"
    >
      {mark}
    </Link>
  );
}
