import type { Metadata } from "next";

import { SITE } from "@/lib/constants";

interface BuildMetadataInput {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}

/** Genera metadatos consistentes (Open Graph, Twitter, canonical). */
export function buildMetadata({
  title,
  description = SITE.description,
  path = "/",
  image,
  noindex = false,
}: BuildMetadataInput): Metadata {
  const url = new URL(path, SITE.url).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: "es_ES",
      url,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: SITE.twitter,
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

const absolute = (path: string) => new URL(path, SITE.url).toString();

/** Numero mostrado en titulos tipo "Las 10 mejores ...". */
const TOP_N = 10;

/**
 * Titulo programatico para landing categoria+ciudad.
 *
 * Formato: "Top 10 {nicho} en {localidad} - {año} Reseñas". Omitimos "empresas
 * de" a proposito: la gente busca el nicho directo ("restaurantes en Madrid"),
 * no "empresas de restaurantes". Ese keyword es el que posiciona.
 */
export function landingTitle(categoryName: string, cityName: string): string {
  const year = new Date().getFullYear();
  return `Top ${TOP_N} ${categoryName.toLowerCase()} en ${cityName} - ${year} Reseñas`;
}

export function landingDescription(
  categoryName: string,
  cityName: string,
  count: number,
): string {
  const noun = categoryName.toLowerCase();
  const year = new Date().getFullYear();
  if (count <= 0) {
    return `Directorio de ${noun} en ${cityName}. Compara valoraciones, servicios y contacta al instante. Actualizado en ${year}.`;
  }
  return `Top ${count} ${noun} en ${cityName}: compara valoraciones reales, reseñas y proyectos, y contacta al instante (${year}).`;
}

/** FAQs generadas para enriquecer la landing y obtener rich results. */
export function landingFaqs(
  categoryName: string,
  cityName: string,
  count: number,
  topName?: string,
): { question: string; answer: string }[] {
  const noun = categoryName.toLowerCase();
  const faqs: { question: string; answer: string }[] = [
    {
      question: `¿Cuales son los mejores ${noun} en ${cityName}?`,
      answer: topName
        ? `Segun las valoraciones de clientes y nuestro indice de calidad, ${topName} encabeza el ranking de ${noun} en ${cityName}. En esta pagina tienes el listado completo ordenado por puntuacion.`
        : `Encuentra en esta pagina los ${noun} mejor valorados de ${cityName}, ordenados segun reseñas reales y nuestro indice de calidad.`,
    },
    {
      question: `¿Cuanto cuesta contratar ${noun} en ${cityName}?`,
      answer: `El precio depende del alcance del servicio y del proveedor. Compara los perfiles de ${noun} en ${cityName}, revisa sus proyectos y solicita presupuesto sin compromiso a traves de cada ficha.`,
    },
    {
      question: `¿Como elijo el mejor ${noun} en ${cityName}?`,
      answer: `Fijate en las valoraciones verificadas, el numero de reseñas, los proyectos publicados y la informacion de contacto del perfil. Todos estos factores influyen en el orden del listado.`,
    },
  ];
  if (count > 0) {
    faqs.push({
      question: `¿Cuantos ${noun} hay en ${cityName} en Destaco?`,
      answer: `Actualmente listamos ${count} ${noun} en ${cityName}, y ampliamos el directorio cada dia con nuevas fichas verificadas.`,
    });
  }
  return faqs;
}

/** JSON-LD de la organizacion (se inyecta en el layout raiz). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    sameAs: [`https://twitter.com/${SITE.twitter.replace("@", "")}`],
  };
}

/** JSON-LD del buscador del sitio (sitelinks searchbox). */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/empresas?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** JSON-LD de migas de pan. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export interface LocalBusinessInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  phone?: string;
  website?: string;
  image?: string;
  addressLine?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  ratingAvg?: number;
  reviewCount?: number;
}

/** JSON-LD LocalBusiness — para la pagina de perfil de empresa. */
export function localBusinessJsonLd(company: LocalBusinessInput) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    url: absolute(`/empresa/${company.slug}`),
    description: company.description,
    telephone: company.phone,
    image: company.image,
    sameAs: company.website ? [company.website] : undefined,
  };

  if (company.addressLine || company.city) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: company.addressLine,
      postalCode: company.postalCode,
      addressLocality: company.city,
      addressRegion: company.province,
      addressCountry: "ES",
    };
  }
  if (company.latitude && company.longitude) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: company.latitude,
      longitude: company.longitude,
    };
  }
  if (company.ratingAvg && company.reviewCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: company.ratingAvg,
      reviewCount: company.reviewCount,
      bestRating: 5,
    };
  }
  return data;
}

/** JSON-LD FAQPage — para FAQs generadas con IA. */
export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** JSON-LD ItemList — para landing pages de categoria/ciudad. */
export function itemListJsonLd(
  items: { name: string; path: string }[],
  name: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absolute(item.path),
    })),
  };
}
