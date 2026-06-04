"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Database,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";

import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/reclamaciones", label: "Reclamaciones", icon: ShieldCheck },
  { href: "/admin/resenas", label: "Resenas", icon: Star },
  { href: "/admin/ingesta", label: "Ingesta y jobs", icon: Database },
  { href: "/admin/seo", label: "SEO e indexacion", icon: Search },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="lg:w-56 lg:shrink-0">
      <p className="text-muted-foreground mb-3 px-3 text-xs font-semibold tracking-wide uppercase">
        Administracion
      </p>
      <nav className="flex gap-1 lg:flex-col">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action={logout} className="mt-4 border-t pt-4">
        <button
          type="submit"
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          <LogOut className="size-4" />
          Cerrar sesion
        </button>
      </form>
    </aside>
  );
}
