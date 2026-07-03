import Link from "next/link";
import { Building2, Eye, Plus, Star, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";
import { getMyCompanies, getMyCompanyMetrics } from "@/lib/data/dashboard";
import { formatCompact } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const [companies, metrics] = session?.user
    ? await Promise.all([
        getMyCompanies(session.user.id),
        getMyCompanyMetrics(session.user.id),
      ])
    : [[], []];

  const totalViews = companies.reduce((sum, c) => sum + c.viewCount, 0);
  const totalReviews = companies.reduce((sum, c) => sum + c.reviewCount, 0);

  // "Clientes" = contactos reales conseguidos en sus fichas: clics en telefono,
  // email, web y "contactar" (eventos del ProfileTracker via /api/metrics).
  const totalClients = metrics.reduce(
    (sum, m) =>
      sum + m.phoneClicks + m.emailClicks + m.websiteClicks + m.contactClicks,
    0,
  );
  // La cuenta admin mantiene el valor fijado a mano por Raul.
  const isAdmin = session?.user?.role === "ADMIN";
  const cards = [
    { icon: Users, label: "Clientes", value: isAdmin ? 894 : totalClients },
    { icon: Eye, label: "Visitas totales", value: totalViews },
    { icon: Star, label: "Resenas recibidas", value: totalReviews },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona tus empresas en Destaco.es.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/dashboard/empresas/nueva">
            <Plus className="size-4" />
            Publicar empresa
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl border p-5">
            <card.icon className="text-muted-foreground size-5" />
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {formatCompact(card.value)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">{card.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold tracking-tight">
        Mis empresas
      </h2>
      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aun no has publicado ninguna empresa"
          description="Publica tu empresa gratis y aparece ante miles de clientes."
        />
      ) : (
        <div className="space-y-2">
          {companies.slice(0, 5).map((company) => (
            <Link
              key={company.id}
              href={`/dashboard/empresas/${company.id}/editar`}
              className="bg-card hover:border-foreground/20 flex items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="font-medium">{company.name}</p>
                <p className="text-muted-foreground text-sm">
                  {company.category}
                  {company.city ? ` · ${company.city}` : ""}
                </p>
              </div>
              <span className="text-muted-foreground text-sm">Editar</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
