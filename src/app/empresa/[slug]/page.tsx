import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryIcon } from "@/components/category-icon";
import { JsonLd } from "@/components/json-ld";
import { ProfileTracker } from "@/components/metrics/profile-tracker";
import { ReviewForm } from "@/components/reviews/review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { auth } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/data/companies";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  localBusinessJsonLd,
} from "@/lib/seo";

export const revalidate = 3600;

const PRICE_LABEL: Record<number, string> = {
  1: "€",
  2: "€€",
  3: "€€€",
  4: "€€€€",
};

const DAYS: [string, string][] = [
  ["mon", "Lunes"],
  ["tue", "Martes"],
  ["wed", "Miercoles"],
  ["thu", "Jueves"],
  ["fri", "Viernes"],
  ["sat", "Sabado"],
  ["sun", "Domingo"],
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return {};
  return buildMetadata({
    title:
      company.metaTitle ??
      `${company.name} — ${company.categoryName}${company.city ? ` en ${company.city}` : ""}`,
    description:
      company.metaDescription ??
      company.shortDescription ??
      `${company.name}, empresa de ${company.categoryName} en Espana. Valoraciones, servicios y contacto.`,
    path: `/empresa/${slug}`,
  });
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const session = await auth();

  const mapsQuery =
    company.latitude && company.longitude
      ? `${company.latitude},${company.longitude}`
      : [company.addressLine, company.city, company.province]
          .filter(Boolean)
          .join(", ");

  return (
    <>
      <ProfileTracker slug={company.slug} />
      <JsonLd
        data={localBusinessJsonLd({
          name: company.name,
          slug: company.slug,
          description: company.description ?? company.shortDescription ?? "",
          category: company.categoryName,
          image: company.coverImage ?? undefined,
          phone: company.phone ?? undefined,
          website: company.website ?? undefined,
          addressLine: company.addressLine ?? undefined,
          postalCode: company.postalCode ?? undefined,
          city: company.city ?? undefined,
          province: company.province ?? undefined,
          latitude: company.latitude ?? undefined,
          longitude: company.longitude ?? undefined,
          ratingAvg: company.rating || undefined,
          reviewCount: company.reviewCount || undefined,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: company.categoryName, path: `/${company.categorySlug}` },
          { name: company.name, path: `/empresa/${company.slug}` },
        ])}
      />
      {company.faqs.length > 0 && <JsonLd data={faqJsonLd(company.faqs)} />}

      {/* Cabecera */}
      <div className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="dotted-bg absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 60% at 30% 0%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 30% 0%, black, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Inicio", href: "/" },
              { name: company.categoryName, href: `/${company.categorySlug}` },
              { name: company.name },
            ]}
          />
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            {company.coverImage ? (
              <div className="size-20 shrink-0 overflow-hidden rounded-2xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.coverImage}
                  alt={company.name}
                  className="size-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-muted text-foreground grid size-20 shrink-0 place-items-center rounded-2xl border text-2xl font-bold">
                {initials(company.name)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {company.name}
                </h1>
                {company.verified && (
                  <BadgeCheck className="text-primary size-6" />
                )}
                {company.featured && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Destacada
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link
                  href={`/${company.categorySlug}`}
                  className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <CategoryIcon
                    name={company.categoryIcon}
                    className="size-4"
                  />
                  {company.categoryName}
                </Link>
                {company.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {company.city}
                    {company.province ? `, ${company.province}` : ""}
                  </span>
                )}
                {company.priceRange && (
                  <span className="font-medium">
                    {PRICE_LABEL[company.priceRange]}
                  </span>
                )}
              </div>
              {company.reviewCount > 0 && (
                <div className="mt-3">
                  <StarRating
                    value={company.rating}
                    reviewCount={company.reviewCount}
                    size="md"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {company.phone && (
                <Button asChild variant="brand">
                  <a href={`tel:${company.phone}`} data-track="PHONE_CLICK">
                    <Phone className="size-4" />
                    Llamar
                  </a>
                </Button>
              )}
              {company.website && (
                <Button asChild variant="outline">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    data-track="WEBSITE_CLICK"
                  >
                    <Globe className="size-4" />
                    Web
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-10 lg:col-span-2">
          {company.description && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">
                Sobre {company.name}
              </h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {company.description}
              </p>
            </section>
          )}

          {company.services.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">
                Servicios
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {company.services.map((service) => (
                  <div
                    key={service.name}
                    className="bg-card rounded-xl border p-4"
                  >
                    <p className="font-medium">{service.name}</p>
                    {service.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {company.projects.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">
                Proyectos
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {company.projects.map((project) => (
                  <article
                    key={project.id}
                    className="bg-card overflow-hidden rounded-xl border"
                  >
                    {project.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverImage}
                        alt={project.title}
                        className="h-40 w-full object-cover"
                      />
                    )}
                    <div className="p-4">
                      <p className="font-medium">{project.title}</p>
                      {project.client && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Cliente: {project.client}
                        </p>
                      )}
                      {project.description && (
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                          {project.description}
                        </p>
                      )}
                      {project.result && (
                        <p className="mt-2 text-sm font-medium">
                          Resultado: {project.result}
                        </p>
                      )}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-primary mt-3 inline-flex text-sm font-medium hover:underline"
                        >
                          Ver caso completo
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {company.faqs.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">
                Preguntas frecuentes
              </h2>
              <div className="mt-4 space-y-2">
                {company.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group bg-card rounded-xl border p-4"
                  >
                    <summary className="cursor-pointer list-none font-medium">
                      {faq.question}
                    </summary>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              Valoraciones
            </h2>
            {company.reviews.length > 0 ? (
              <div className="mt-4 space-y-4">
                {company.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="bg-card rounded-xl border p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{review.authorName}</p>
                      <StarRating value={review.rating} />
                    </div>
                    {review.title && (
                      <p className="mt-2 font-medium">{review.title}</p>
                    )}
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {review.body}
                    </p>
                    {review.reply && (
                      <div className="bg-muted mt-3 rounded-lg p-3">
                        <p className="text-xs font-semibold">
                          Respuesta de {company.name}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {review.reply}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-card mt-4 flex items-center gap-3 rounded-xl border border-dashed p-5">
                <MessageSquare className="text-muted-foreground size-5" />
                <p className="text-muted-foreground text-sm">
                  Comparte tu experiencia con {company.name} y ayuda a otros
                  usuarios.
                </p>
              </div>
            )}

            {session?.user ? (
              <ReviewForm companySlug={company.slug} />
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                <Link href="/login" className="text-foreground font-medium">
                  Inicia sesion
                </Link>{" "}
                para escribir una resena.
              </p>
            )}
          </section>
        </div>

        {/* Barra lateral */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold tracking-tight">Contacto</h2>
            <div className="mt-3 space-y-3 text-sm">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  data-track="PHONE_CLICK"
                  className="hover:text-primary flex items-center gap-2.5 transition-colors"
                >
                  <Phone className="text-muted-foreground size-4" />
                  {company.phone}
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  data-track="EMAIL_CLICK"
                  className="hover:text-primary flex items-center gap-2.5 transition-colors"
                >
                  <Mail className="text-muted-foreground size-4" />
                  {company.email}
                </a>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  data-track="WEBSITE_CLICK"
                  className="hover:text-primary flex items-center gap-2.5 break-all transition-colors"
                >
                  <Globe className="text-muted-foreground size-4 shrink-0" />
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {(company.addressLine || company.city) && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span>
                    {[company.addressLine, company.postalCode, company.city]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
            {mapsQuery && (
              <Button asChild variant="outline" className="mt-4 w-full">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en el mapa
                </a>
              </Button>
            )}
          </div>

          {company.openingHours && (
            <div className="bg-card rounded-xl border p-5">
              <h2 className="flex items-center gap-2 font-semibold tracking-tight">
                <Clock className="size-4" />
                Horario
              </h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                {DAYS.map(([key, label]) => {
                  const ranges = company.openingHours?.[key];
                  return (
                    <div key={key} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right">
                        {ranges && ranges.length > 0
                          ? ranges
                              .map(([open, close]) => `${open}–${close}`)
                              .join(", ")
                          : "Cerrado"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}

          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold tracking-tight">Es tu empresa?</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Reclama este perfil gratis y gestiona tu informacion.
            </p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href={`/reclamar/${company.slug}`}>Reclamar perfil</Link>
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
