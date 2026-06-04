"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, Menu, Search, Shield, X } from "lucide-react";
import type { UserRole } from "@prisma/client";

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

interface SiteHeaderProps {
  user: { name?: string | null; role: UserRole } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "Cuenta";
  const initial = (user?.name?.[0] ?? "U").toUpperCase();

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
          <Link
            href="/empresas"
            className="text-muted-foreground border-border bg-secondary/60 hover:bg-secondary hidden h-9 w-56 items-center gap-2 rounded-lg border px-3 text-sm transition-colors lg:flex"
          >
            <Search className="size-4" />
            Buscar empresas...
          </Link>

          <ThemeToggle />

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
                variant="brand"
                size="sm"
                className="hidden sm:inline-flex"
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
          {!user && (
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/login">Acceder</Link>
              </Button>
              <Button asChild variant="brand" size="sm" className="flex-1">
                <Link href="/registro">Publicar empresa</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
