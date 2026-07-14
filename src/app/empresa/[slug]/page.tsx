import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryIcon } from "@/components/category-icon";
import { CoverImage } from "@/components/cover-image";
import { JsonLd } from "@/components/json-ld";
import { ProfileTracker } from "@/components/metrics/profile-tracker";
import { ReviewGate } from "@/components/reviews/review-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { getCompanyBySlug, getRelatedCompanies } from "@/lib/data/companies";
import {
  breadcrumbJsonLd,
  buildMetadata,
  companyIntro,
  companyMetaDescription,
  companyMetaTitle,
  faqJsonLd,
  localBusinessJsonLd,
} from "@/lib/seo";
import {
  COMPANY_SIZE_LABEL,
  COMPANY_SIZE_RANGE,
  displayWebsite,
  formatAddress,
} from "@/lib/utils";

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
    title: company.metaTitle ?? companyMetaTitle(company),
    description: company.metaDescription ?? companyMetaDescription(company),
    image: company.coverImage ?? undefined,
    path: `/empresa/${slug}`,
  });
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const related = await getRelatedCompanies(slug);

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
          foundingYear: company.founded ?? undefined,
          employeesMin: company.size
            ? COMPANY_SIZE_RANGE[company.size].min
            : undefined,
          employeesMax: company.size
            ? COMPANY_SIZE_RANGE[company.size].max
            : undefined,
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
              <CoverImage
                src={company.coverImage}
                alt={company.name}
                loading="eager"
                className="size-20 shrink-0 overflow-hidden rounded-2xl border"
                imgClassName="size-full object-cover"
                fallback={
                  <div className="bg-muted text-foreground grid size-20 shrink-0 place-items-center rounded-2xl border text-2xl font-bold">
                    {initials(company.name)}
                  </div>
                }
              />
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
                {company.priceFrom != null && (
                  <span className="font-medium">
                    Desde {company.priceFrom} €
                  </span>
                )}
                {company.founded && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    Desde {company.founded}
                  </span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" />
                    {COMPANY_SIZE_LABEL[company.size]}
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
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              Sobre {company.name}
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {company.description ?? companyIntro(company)}
            </p>
            {company.keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {company.keywords.slice(0, 12).map((kw) => (
                  <span
                    key={kw}
                    className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </section>

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
                      <CoverImage
                        src={project.coverImage}
                        alt={project.title}
                        imgClassName="h-40 w-full object-cover"
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

            <ReviewGate companySlug={company.slug} />
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
                  {displayWebsite(company.website)}
                </a>
              )}
              {formatAddress(company) && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span>{formatAddress(company)}</span>
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
            <h2 className="font-semibold tracking-tight">Explora mas</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {company.citySlug && (
                <Link
                  href={`/${company.categorySlug}/${company.citySlug}`}
                  className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <MapPin className="size-4 shrink-0" />
                  Mejores {company.categoryName.toLowerCase()} en {company.city}
                </Link>
              )}
              <Link
                href={`/${company.categorySlug}`}
                className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
              >
                <CategoryIcon
                  name={company.categoryIcon}
                  className="size-4 shrink-0"
                />
                Todos los {company.categoryName.toLowerCase()} en España
              </Link>
              {company.provinceSlug && (
                <Link
                  href={`/provincias/${company.provinceSlug}`}
                  className="text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                >
                  <Building2 className="size-4 shrink-0" />
                  Empresas en {company.province}
                </Link>
              )}
            </div>
          </div>

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

      {related.length > 0 && (
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold tracking-tight">
              {company.city
                ? `Otros ${company.categoryName.toLowerCase()} en ${company.city}`
                : `Otros ${company.categoryName.toLowerCase()}`}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Compara {company.name} con otras opciones antes de decidir.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/empresa/${r.slug}`}
                  className="bg-card hover:border-foreground/20 flex items-center justify-between gap-3 rounded-xl border p-4 transition-all hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {company.categoryName}
                      {r.city ? ` · ${r.city}` : ""}
                    </p>
                  </div>
                  {r.reviewCount > 0 && (
                    <span className="text-muted-foreground shrink-0 text-sm font-medium tabular-nums">
                      {r.rating.toFixed(1).replace(".", ",")} ★
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
