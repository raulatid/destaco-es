import Link from "next/link";
import { Mail } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FEATURED_CATEGORIES,
  NAV_LINKS,
  SITE,
  TOP_PROVINCES,
} from "@/lib/constants";

const COMPANY_LINKS = [
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
  { label: "Precios", href: "/precios" },
  { label: "Contacto", href: "/contacto" },
  { label: "Publicar empresa", href: "/registro" },
];

const LEGAL_LINKS = [
  { label: "Aviso legal", href: "/legal/aviso-legal" },
  { label: "Privacidad", href: "/legal/privacidad" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Terminos", href: "/legal/terminos" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-foreground mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-border/60 bg-card/40 border-t">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="text-muted-foreground mt-4 max-w-xs text-sm leading-relaxed">
              {SITE.description}
            </p>
            <form className="mt-6 max-w-sm">
              <label className="text-foreground mb-2 block text-sm font-medium">
                Recibe las mejores empresas cada semana
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="brand">
                  Suscribirme
                </Button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            <FooterColumn
              title="Categorias"
              links={FEATURED_CATEGORIES.slice(0, 6).map((c) => ({
                label: c.name,
                href: `/${c.slug}`,
              }))}
            />
            <FooterColumn
              title="Provincias"
              links={TOP_PROVINCES.slice(0, 6).map((p) => ({
                label: p.name,
                href: `/provincias/${p.slug}`,
              }))}
            />
            <FooterColumn
              title="Destaco.es"
              links={[...NAV_LINKS.slice(0, 1), ...COMPANY_LINKS]}
            />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        <div className="border-border/60 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {SITE.name}. Hecho en Espana.
          </p>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <p className="text-muted-foreground text-xs">
              Datos de fuentes publicas y verificadas.
            </p>
            <p className="text-muted-foreground text-xs">
              Desarrollado por{" "}
              <a
                href="https://vertigomkt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Vértigo Marketing
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
