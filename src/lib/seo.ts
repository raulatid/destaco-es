import type { Metadata } from "next";

import { SITE, nounArticle, nounIsFeminine } from "@/lib/constants";

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
    // "noindex, follow": la pagina no se indexa (thin/duplicada/privada) pero el
    // crawler sigue los enlaces, para que descubra las fichas de empresa.
    robots: noindex ? { index: false, follow: true } : undefined,
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
 * Formato: "Top 10 mejores {nicho} en {localidad} ({año})". `noun` es la
 * palabra clave de busqueda real (ej. "abogados", "agencias de marketing"),
 * NO el nombre de catalogo. La gente busca el nicho con "mejores" + ciudad
 * ("mejores abogados en Barcelona"); ese es el keyword que posiciona.
 */
export function landingTitle(noun: string, cityName: string): string {
  const year = new Date().getFullYear();
  return `Top ${TOP_N} mejores ${noun} en ${cityName} (${year})`;
}

export function landingDescription(
  noun: string,
  cityName: string,
  count: number,
): string {
  const year = new Date().getFullYear();
  if (count <= 0) {
    return `Encuentra ${nounArticle(noun, true)} mejores ${noun} en ${cityName}: valoraciones, opiniones reales y datos de contacto. Directorio actualizado en ${year}.`;
  }
  return `${nounArticle(noun)} ${count} mejores ${noun} en ${cityName}: compara valoraciones reales, opiniones y precios, y contacta gratis. Actualizado en ${year}.`;
}

/** FAQs generadas para enriquecer la landing y obtener rich results. */
export function landingFaqs(
  noun: string,
  cityName: string,
  count: number,
  topName?: string,
): { question: string; answer: string }[] {
  const g = nounIsFeminine(noun) ? "a" : "o";
  const faqs: { question: string; answer: string }[] = [
    {
      question: `¿Cuales son ${nounArticle(noun, true)} mejores ${noun} en ${cityName}?`,
      answer: topName
        ? `Segun las valoraciones de clientes y nuestro indice de calidad, ${topName} encabeza el ranking de ${noun} en ${cityName}. En esta pagina tienes el listado completo ordenado por puntuacion.`
        : `Encuentra en esta pagina ${nounArticle(noun, true)} ${noun} mejor valorad${g}s de ${cityName}, ordenad${g}s segun reseñas reales y nuestro indice de calidad.`,
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

/** FAQs a nivel nacional para la landing de una categoria (sin ciudad). */
export function categoryFaqs(
  noun: string,
  count: number,
): { question: string; answer: string }[] {
  const g = nounIsFeminine(noun) ? "a" : "o";
  const faqs: { question: string; answer: string }[] = [
    {
      question: `¿Como encuentro ${nounArticle(noun, true)} mejores ${noun} en España?`,
      answer: `En Destaco listamos ${noun} de toda España ordenad${g}s por valoraciones reales, numero de opiniones y nuestro indice de calidad. Filtra por provincia o ciudad y compara cada perfil antes de contactar.`,
    },
    {
      question: `¿Cuanto cuesta contratar ${noun}?`,
      answer: `El precio depende del servicio, la experiencia del profesional y la zona. Compara los perfiles, revisa sus servicios y proyectos, y solicita presupuesto sin compromiso desde cada ficha.`,
    },
    {
      question: `¿${nounArticle(noun)} ${noun} de Destaco estan verificad${g}s?`,
      answer: `Reunimos la informacion de fuentes publicas y verificadas y la actualizamos a diario. Ademas, cada empresa puede reclamar su perfil gratis y verificar sus datos de contacto.`,
    },
    {
      question: `¿Puedo añadir mi empresa al directorio de ${noun}?`,
      answer: `Si. Si tienes una empresa del sector, puedes reclamar tu perfil gratis o publicarlo en minutos. Con el plan Destacado apareceras por encima del resto en tu categoria, a nivel nacional y en cada ciudad.`,
    },
  ];
  if (count > 0) {
    faqs.push({
      question: `¿Cuantos ${noun} hay en Destaco?`,
      answer: `Actualmente listamos ${count} ${noun} en España y ampliamos el directorio cada dia con nuevas fichas.`,
    });
  }
  return faqs;
}

/** FAQs generales de la home (que es Destaco, gratis, datos, contacto). */
export function homeFaqs(): { question: string; answer: string }[] {
  return [
    {
      question: "¿Que es Destaco.es?",
      answer:
        "Destaco.es es un directorio de empresas de toda España. Reunimos miles de negocios verificados por categoria, provincia y ciudad para que encuentres y compares profesionales de confianza y contactes con ellos al instante.",
    },
    {
      question: "¿Es gratis aparecer en Destaco?",
      answer:
        "Si. Crear o reclamar el perfil de tu empresa es totalmente gratis. Ademas, ofrecemos un plan Destacado opcional para aparecer por encima del resto y ganar mas visibilidad.",
    },
    {
      question: "¿De donde salen los datos de las empresas?",
      answer:
        "Recopilamos la informacion de fuentes publicas y verificadas, y la actualizamos a diario. Cada empresa puede reclamar su perfil para completar y corregir sus datos.",
    },
    {
      question: "¿Como hago que mi empresa destaque?",
      answer:
        "Reclama tu perfil gratis para gestionar tu informacion, subir proyectos y responder reseñas. Con el plan Destacado tu empresa aparece en las primeras posiciones de tu categoria, a nivel nacional y en cada ciudad.",
    },
    {
      question: "¿Como contacto con una empresa?",
      answer:
        "En cada ficha encontraras el telefono, la web y la direccion de la empresa, junto a sus valoraciones y opiniones. Contactas directamente, sin intermediarios ni comisiones.",
    },
  ];
}

/** FAQs de la pagina de precios / plan Destacado. */
export function pricingFaqs(): { question: string; answer: string }[] {
  return [
    {
      question: "¿Que incluye el plan Destacado?",
      answer:
        "Tu empresa aparece por encima del resto en su categoria, tanto a nivel nacional como en cada ciudad, con una insignia de 'Destacado'. Consigues mas visibilidad, mas visitas y mas clientes potenciales.",
    },
    {
      question: "¿Cuanto cuesta el plan Destacado?",
      answer:
        "49,99 € al año + IVA (21%), es decir 60,49 € IVA incluido (precio de lanzamiento, antes 100 €). Sin permanencia: se renueva cada año y puedes cancelar la renovacion cuando quieras.",
    },
    {
      question: "¿Como se realiza el pago y la factura?",
      answer:
        "El pago se realiza de forma segura con tarjeta a traves de Stripe. Recibiras una factura con IVA emitida por Raúl Díaz Tapia (autonomo, NIF 21067209Z) con todos los datos para tu contabilidad; puedes descargarla desde el portal de cliente.",
    },
    {
      question: "¿Cuando empieza a destacar mi empresa?",
      answer:
        "En cuanto se confirma el pago, tu empresa pasa a mostrarse en posicion destacada en su categoria y ciudad.",
    },
    {
      question: "¿Puedo seguir usando el plan gratuito?",
      answer:
        "Si. El plan Gratis te permite tener tu perfil, recibir reseñas y aparecer en el directorio sin coste. El plan Destacado es opcional para ganar visibilidad.",
    },
  ];
}

// ---- SEO de perfil de empresa --------------------------------------------

interface CompanySeoInput {
  name: string;
  categoryName: string;
  city: string | null;
  province: string | null;
  rating: number;
  reviewCount: number;
  priceRange: number | null;
  services: { name: string }[];
  shortDescription?: string | null;
}

const PRICE_TEXT: Record<number, string> = {
  1: "precios economicos",
  2: "buena relacion calidad-precio",
  3: "servicio premium",
  4: "gama alta",
};

/** Meta titulo optimizado para la ficha (keyword = nombre + nicho + ciudad). */
export function companyMetaTitle(c: CompanySeoInput): string {
  const place = c.city ?? c.province ?? "España";
  return `${c.name} — ${c.categoryName} en ${place}: opiniones y contacto`;
}

/** Meta descripcion rica: valoracion, nº de opiniones, servicios y ubicacion. */
export function companyMetaDescription(c: CompanySeoInput): string {
  const place = c.city
    ? `${c.city}${c.province && c.province !== c.city ? ` (${c.province})` : ""}`
    : (c.province ?? "España");
  const parts: string[] = [`${c.name}, ${c.categoryName} en ${place}.`];
  if (c.reviewCount > 0) {
    parts.push(
      `Valoracion ${c.rating.toFixed(1)}/5 con ${c.reviewCount} opiniones.`,
    );
  }
  if (c.services.length > 0) {
    parts.push(`Servicios: ${c.services.slice(0, 4).map((s) => s.name).join(", ")}.`);
  }
  parts.push("Telefono, direccion, horario y opiniones reales.");
  return parts.join(" ");
}

/**
 * Parrafo introductorio generado para fichas sin descripcion: aporta texto
 * con keywords (nicho + ciudad) y evita el "thin content".
 */
export function companyIntro(c: CompanySeoInput): string {
  const place = c.city ?? c.province ?? "España";
  const loc =
    c.province && c.city && c.province !== c.city
      ? `${place}, en la provincia de ${c.province}`
      : place;
  const bits: string[] = [
    `${c.name} forma parte del directorio de ${c.categoryName.toLowerCase()} en ${loc}.`,
  ];
  if (c.services.length > 0) {
    bits.push(
      `Entre sus servicios destacan ${c.services
        .slice(0, 5)
        .map((s) => s.name.toLowerCase())
        .join(", ")}.`,
    );
  }
  if (c.priceRange && PRICE_TEXT[c.priceRange]) {
    bits.push(`Ofrece ${PRICE_TEXT[c.priceRange]}.`);
  }
  if (c.reviewCount > 0) {
    bits.push(
      `Cuenta con una valoracion media de ${c.rating.toFixed(1)} sobre 5 basada en ${c.reviewCount} opiniones de clientes.`,
    );
  } else {
    bits.push(
      "Consulta sus datos de contacto, ubicacion y horario, y deja tu opinion para ayudar a otros usuarios.",
    );
  }
  return bits.join(" ");
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
  foundingYear?: number;
  employeesMin?: number;
  employeesMax?: number;
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
  if (company.foundingYear) {
    data.foundingDate = String(company.foundingYear);
  }
  if (company.employeesMin) {
    data.numberOfEmployees = {
      "@type": "QuantitativeValue",
      minValue: company.employeesMin,
      ...(company.employeesMax ? { maxValue: company.employeesMax } : {}),
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
