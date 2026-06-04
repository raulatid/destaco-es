import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Pasa null para renderizar el wordmark sin enlace. */
  href?: string | null;
}

/**
 * Wordmark de marca: "destaco." en negro/blanco segun el tema.
 */
export function Logo({ className, href = "/" }: LogoProps) {
  const mark = (
    <span
      className={cn(
        "text-foreground text-xl font-extrabold tracking-tight",
        className,
      )}
    >
      destaco.
    </span>
  );

  if (href === null) return mark;

  return (
    <Link
      href={href}
      aria-label="Destaco.es — inicio"
      className="transition-opacity hover:opacity-70"
    >
      {mark}
    </Link>
  );
}
