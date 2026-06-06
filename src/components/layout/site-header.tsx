"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Star,
  X,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hasFeatured, setHasFeatured] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "Cuenta";
  const initial = (user?.name?.[0] ?? "U").toUpperCase();

  // Si el usuario tiene una empresa destacada ocultamos el CTA "Destaca tu
  // empresa". Para los visitantes anonimos el CTA siempre se muestra.
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

  const showDestacar = !user || !hasFeatured;

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/empresas?q=${encodeURIComponent(q)}` : "/empresas");
  }

  return (
    <header className="glass border-border/60 sticky top-0 z-50 w-full border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="ml-3 hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <form
            onSubmit={onSearch}
            className="border-border bg-secondary/60 focus-within:bg-secondary focus-within:ring-ring/40 hidden h-9 w-56 items-center gap-2 rounded-lg border px-3 transition-colors focus-within:ring-2 lg:flex"
          >
            <button type="submit" aria-label="Buscar" className="shrink-0">
              <Search className="text-muted-foreground size-4" />
            </button>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresas..."
              className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
            />
          </form>

          <ThemeToggle />

          {showDestacar && (
            <Button
              asChild
              variant="brand"
              size="sm"
              className="ring-primary/40 hidden shadow-sm ring-1 sm:inline-flex"
            >
              <Link href="/destacar">
                <Star className="size-4" />
                Destaca tu empresa
              </Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="bg-muted grid size-6 place-items-center rounded-full text-xs font-semibold">
                    {initial}
                  </span>
                  <span className="hidden sm:inline">{firstName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{user.name ?? "Mi cuenta"}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    Mi panel
                  </Link>
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield />
                      Panel de admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <form action={logout}>
                  <button
                    type="submit"
                    className="focus:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none [&_svg]:size-4"
                  >
                    <LogOut />
                    Cerrar sesion
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/login">Acceder</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex"
              >
                <Link href="/registro">Publicar empresa</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-border/60 overflow-hidden border-t transition-[max-height] duration-300 md:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="hover:bg-accent block rounded-lg px-3 py-2.5 text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
          {showDestacar && (
            <Button
              asChild
              variant="brand"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              <Link href="/destacar">
                <Star className="size-4" />
                Destaca tu empresa
              </Link>
            </Button>
          )}
          {!user && (
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/login" onClick={() => setOpen(false)}>
                  Acceder
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/registro" onClick={() => setOpen(false)}>
                  Publicar empresa
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
