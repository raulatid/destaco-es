"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Boton flotante "Destacar mi empresa", siempre visible (sticky) en la esquina
 * inferior derecha. Enlaza a /destacar para maximizar la conversion al plan
 * Destacado.
 *
 * Se oculta:
 *  - en las propias paginas de conversion/cuenta (/destacar, /login, /registro,
 *    /dashboard, /admin), donde no aporta;
 *  - si el usuario ya tiene una empresa destacada (mismo criterio que el CTA del
 *    header), para no insistir a quien ya ha contratado.
 */
const HIDDEN_PREFIXES = [
  "/destacar",
  "/login",
  "/registro",
  "/dashboard",
  "/admin",
];

export function DestacarFab() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [hasFeatured, setHasFeatured] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasFeatured(false);
      return;
    }
    let active = true;
    fetch("/api/me/featured")
      .then((res) => (res.ok ? res.json() : { hasFeatured: false }))
      .then((data: { hasFeatured?: boolean }) => {
        if (active) setHasFeatured(Boolean(data.hasFeatured));
      })
      .catch(() => {
        if (active) setHasFeatured(false);
      });
    return () => {
      active = false;
    };
  }, [user?.email]);

  const hiddenRoute = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (hiddenRoute || (user && hasFeatured)) return null;

  return (
    <Link
      href="/destacar"
      aria-label="Destacar mi empresa"
      className={cn(
        "bg-brand-gradient text-primary-foreground ring-primary/30 fixed right-4 bottom-4 z-40",
        "inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold",
        "shadow-lg ring-1 transition-transform hover:scale-[1.03]",
        "sm:right-5 sm:bottom-5",
      )}
    >
      <Star className="size-4 shrink-0" aria-hidden />
      Destacar mi empresa
    </Link>
  );
}
