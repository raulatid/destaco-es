/**
 * Catalogo demo en memoria.
 *
 * Se usa SOLO como fallback cuando PostgreSQL no esta disponible (proyecto sin
 * BD configurada o base de datos dormida). Permite navegar el sitio completo
 * como prototipo — categorias, provincias, landings /[categoria]/[ciudad] y
 * fichas de empresa — sin necesidad de conexion.
 *
 * NO son empresas reales: son datos generados de forma determinista para
 * demostrar la interfaz. Cuando la BD esta conectada nunca se ejecuta esto.
 */
import { FEATURED_CATEGORIES } from "@/lib/constants";
import type {
  CategorySummary,
  CitySummary,
  CompanyCardData,
  CompanyDetail,
  CompanyListResult,
  CompanyReview,
  ProvinceSummary,
} from "./types";

// ---- Referencia geografica (ciudad -> provincia) --------------------------

const CITY_PROVINCE: Record<
  string,
  { city: string; province: string; provinceSlug: string; community: string }
> = {
  madrid: { city: "Madrid", province: "Madrid", provinceSlug: "madrid", community: "Comunidad de Madrid" },
  barcelona: { city: "Barcelona", province: "Barcelona", provinceSlug: "barcelona", community: "Cataluna" },
  valencia: { city: "Valencia", province: "Valencia", provinceSlug: "valencia", community: "Comunidad Valenciana" },
  sevilla: { city: "Sevilla", province: "Sevilla", provinceSlug: "sevilla", community: "Andalucia" },
  malaga: { city: "Malaga", province: "Malaga", provinceSlug: "malaga", community: "Andalucia" },
  bilbao: { city: "Bilbao", province: "Vizcaya", provinceSlug: "vizcaya", community: "Pais Vasco" },
  zaragoza: { city: "Zaragoza", province: "Zaragoza", provinceSlug: "zaragoza", community: "Aragon" },
  alicante: { city: "Alicante", province: "Alicante", provinceSlug: "alicante", community: "Comunidad Valenciana" },
};

const CITY_SLUGS = Object.keys(CITY_PROVINCE);

// Marca + sustantivo por categoria para nombres creibles.
const BRANDS = ["Nexo", "Cumbre", "Avanza", "Iberia", "Vanguardia", "Atlas"];

const CATEGORY_NOUN: Record<string, string> = {
  marketing: "Marketing",
  abogados: "Legal",
  dentistas: "Dental",
  restaurantes: "Cocina",
  reformas: "Reformas",
  tecnologia: "Tech",
  inmobiliarias: "Inmobiliaria",
  belleza: "Estetica",
  formacion: "Academia",
  automocion: "Motor",
  fitness: "Fitness",
  fotografia: "Studio",
};

const COMPANIES_PER_PAIR = 4;

// ---- Generador determinista ----------------------------------------------

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface DemoCompany {
  slug: string;
  name: string;
  categorySlug: string;
  citySlug: string;
  shortDescription: string;
  rating: number;
  reviewCount: number;
  priceRange: number;
  verified: boolean;
  featured: boolean;
  views: number;
  recency: number; // mayor = mas reciente
  services: string[];
  brand: string;
  noun: string;
}

function buildCompanies(): DemoCompany[] {
  const list: DemoCompany[] = [];
  for (const category of FEATURED_CATEGORIES) {
    const noun = CATEGORY_NOUN[category.slug] ?? "Pro";
    for (const citySlug of CITY_SLUGS) {
      const { city } = CITY_PROVINCE[citySlug];
      for (let i = 0; i < COMPANIES_PER_PAIR; i++) {
        const brand = BRANDS[i % BRANDS.length];
        const name = `${brand} ${noun}`;
        const seed = hash(`${category.slug}-${citySlug}-${brand}`);
        const rating = Math.round((3.8 + (seed % 12) / 10) * 10) / 10; // 3.8 - 4.9
        const reviewCount = 6 + (seed % 274); // 6 - 279
        list.push({
          slug: slugify(`${brand}-${noun}-${citySlug}`),
          name,
          categorySlug: category.slug,
          citySlug,
          shortDescription: `${category.name} en ${city}. ${category.description}`,
          rating: Math.min(5, rating),
          reviewCount,
          priceRange: 1 + (seed % 4),
          verified: seed % 5 !== 0,
          featured: i === 0,
          views: 200 + (seed % 9000),
          recency: seed % 1000,
          services: serviceNames(noun),
          brand,
          noun,
        });
      }
    }
  }
  return list;
}

function serviceNames(noun: string): string[] {
  return [
    `${noun} integral`,
    `Consultoria de ${noun.toLowerCase()}`,
    `Proyectos a medida`,
    `Soporte y mantenimiento`,
  ];
}

// Lista generada una sola vez por proceso.
const COMPANIES: DemoCompany[] = buildCompanies();

function categoryName(slug: string): string {
  return FEATURED_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
function categoryIcon(slug: string): string {
  return FEATURED_CATEGORIES.find((c) => c.slug === slug)?.icon ?? "briefcase";
}

function toCard(c: DemoCompany): CompanyCardData {
  return {
    slug: c.slug,
    name: c.name,
    categoryName: categoryName(c.categorySlug),
    categoryIcon: categoryIcon(c.categorySlug),
    city: CITY_PROVINCE[c.citySlug].city,
    shortDescription: c.shortDescription,
    coverImage: null,
    rating: c.rating,
    reviewCount: c.reviewCount,
    priceRange: c.priceRange,
    verified: c.verified,
    featured: c.featured,
    award: false,
    services: c.services,
  };
}

function scoreOf(c: DemoCompany): number {
  return (c.featured ? 1000 : 0) + c.rating * 50 + Math.log10(c.reviewCount + 1) * 30;
}

// ---- API de fallback (consumida por src/lib/data/*) -----------------------

export function demoCategories(): CategorySummary[] {
  return FEATURED_CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    icon: c.icon,
    companyCount: COMPANIES.filter((x) => x.categorySlug === c.slug).length,
    metaTitle: null,
    metaDescription: null,
  }));
}

export function demoCategoryBySlug(slug: string): CategorySummary | null {
  return demoCategories().find((c) => c.slug === slug) ?? null;
}

export function demoProvinces(): ProvinceSummary[] {
  const seen = new Set<string>();
  const out: ProvinceSummary[] = [];
  for (const citySlug of CITY_SLUGS) {
    const info = CITY_PROVINCE[citySlug];
    if (seen.has(info.provinceSlug)) continue;
    seen.add(info.provinceSlug);
    out.push({
      slug: info.provinceSlug,
      name: info.province,
      companyCount: COMPANIES.filter(
        (c) => CITY_PROVINCE[c.citySlug].provinceSlug === info.provinceSlug,
      ).length,
      autonomousCommunity: info.community,
      metaTitle: null,
      metaDescription: null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function demoProvinceBySlug(slug: string): ProvinceSummary | null {
  return demoProvinces().find((p) => p.slug === slug) ?? null;
}

export function demoCities(): CitySummary[] {
  return CITY_SLUGS.map((citySlug) => {
    const info = CITY_PROVINCE[citySlug];
    return {
      slug: citySlug,
      name: info.city,
      province: info.province,
      provinceSlug: info.provinceSlug,
      companyCount: COMPANIES.filter((c) => c.citySlug === citySlug).length,
    };
  });
}

export function demoCityBySlug(slug: string): CitySummary | null {
  return demoCities().find((c) => c.slug === slug) ?? null;
}

export function demoCitiesInProvince(provinceSlug: string): CitySummary[] {
  return demoCities().filter((c) => c.provinceSlug === provinceSlug);
}

export interface DemoListParams {
  categorySlug?: string;
  citySlug?: string;
  provinceSlug?: string;
  query?: string;
  page?: number;
  perPage?: number;
  sort?: string;
  verifiedOnly?: boolean;
  minRating?: number;
}

export function demoListCompanies(params: DemoListParams): CompanyListResult {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? 12;

  let rows = COMPANIES.filter((c) => {
    if (params.categorySlug && c.categorySlug !== params.categorySlug) return false;
    if (params.citySlug && c.citySlug !== params.citySlug) return false;
    if (
      params.provinceSlug &&
      CITY_PROVINCE[c.citySlug].provinceSlug !== params.provinceSlug
    )
      return false;
    if (params.verifiedOnly && !c.verified) return false;
    if (params.minRating && c.rating < params.minRating) return false;
    if (params.query) {
      const q = params.query.toLowerCase();
      if (
        !c.name.toLowerCase().includes(q) &&
        !c.shortDescription.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  switch (params.sort) {
    case "rating":
      rows = rows.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case "reviews":
      rows = rows.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
      break;
    case "views":
      rows = rows.sort((a, b) => b.views - a.views);
      break;
    case "recent":
      rows = rows.sort((a, b) => b.recency - a.recency);
      break;
    default:
      rows = rows.sort((a, b) => scoreOf(b) - scoreOf(a));
  }

  const total = rows.length;
  const start = (page - 1) * perPage;
  return {
    items: rows.slice(start, start + perPage).map(toCard),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function demoFeatured(limit: number): CompanyCardData[] {
  return [...COMPANIES]
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, limit)
    .map(toCard);
}

function buildReviews(c: DemoCompany): CompanyReview[] {
  const authors = ["Laura G.", "Carlos M.", "Marta R.", "Javier S."];
  const bodies = [
    `Trabajo impecable. Recomiendo ${c.name} sin dudarlo.`,
    `Muy profesionales y rapidos. Repetiremos seguro.`,
    `Buena relacion calidad-precio y trato cercano.`,
  ];
  const base = hash(c.slug);
  return bodies.map((body, i) => ({
    id: `${c.slug}-rev-${i}`,
    authorName: authors[(base + i) % authors.length],
    rating: Math.min(5, 4 + ((base + i) % 2)),
    title: i === 0 ? "Excelente servicio" : null,
    body,
    createdAt: new Date(Date.now() - (i + 1) * 86_400_000 * 9).toISOString(),
    reply: i === 0 ? "Gracias por tu confianza." : null,
  }));
}

export function demoCompanyDetail(slug: string): CompanyDetail | null {
  const c = COMPANIES.find((x) => x.slug === slug);
  if (!c) return null;
  const info = CITY_PROVINCE[c.citySlug];
  const name = categoryName(c.categorySlug);
  return {
    slug: c.slug,
    name: c.name,
    shortDescription: c.shortDescription,
    description: `${c.name} es una referencia en ${name.toLowerCase()} en ${info.city}. Combinamos experiencia, cercania y un equipo especializado para ofrecer resultados medibles a nuestros clientes. (Perfil de demostracion.)`,
    coverImage: null,
    categoryName: name,
    categorySlug: c.categorySlug,
    categoryIcon: categoryIcon(c.categorySlug),
    city: info.city,
    citySlug: c.citySlug,
    province: info.province,
    provinceSlug: info.provinceSlug,
    addressLine: `Calle Mayor ${1 + (hash(c.slug) % 120)}, ${info.city}`,
    postalCode: String(28000 + (hash(c.slug) % 999)),
    latitude: null,
    longitude: null,
    phone: `+34 6${String(10000000 + (hash(c.slug) % 89999999))}`,
    email: `hola@${c.slug}.es`,
    website: `https://www.${c.slug}.es`,
    priceRange: c.priceRange,
    founded: 2005 + (hash(c.slug) % 18),
    size: (["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const)[
      hash(c.slug) % 5
    ],
    verified: c.verified,
    featured: c.featured,
    rating: c.rating,
    reviewCount: c.reviewCount,
    metaTitle: null,
    metaDescription: null,
    keywords: [],
    openingHours: {
      mon: [["09:00", "18:00"]],
      tue: [["09:00", "18:00"]],
      wed: [["09:00", "18:00"]],
      thu: [["09:00", "18:00"]],
      fri: [["09:00", "15:00"]],
    },
    services: c.services.map((s) => ({
      name: s,
      description: `Servicio de ${s.toLowerCase()} adaptado a tu proyecto.`,
    })),
    socials: [
      { platform: "instagram", url: `https://instagram.com/${c.slug}` },
      { platform: "linkedin", url: `https://linkedin.com/company/${c.slug}` },
    ],
    faqs: [
      {
        question: `¿Que servicios ofrece ${c.name}?`,
        answer: `Ofrecemos ${c.services.join(", ").toLowerCase()} para clientes en ${info.city} y alrededores.`,
      },
      {
        question: "¿Como puedo pedir presupuesto?",
        answer:
          "Puedes contactar por telefono, email o el formulario del perfil. Respondemos en menos de 24 horas.",
      },
      {
        question: "¿Trabajais con empresas y particulares?",
        answer: "Si, adaptamos cada proyecto al tipo de cliente y su presupuesto.",
      },
    ],
    reviews: buildReviews(c),
    projects: [
      {
        id: `${c.slug}-proj-1`,
        title: `Proyecto destacado en ${info.city}`,
        description: `Caso de exito reciente de ${c.name}.`,
        coverImage: null,
        client: "Cliente confidencial",
        result: "+35% de resultados en 6 meses",
        url: null,
        date: new Date(Date.now() - 120 * 86_400_000).toISOString(),
      },
    ],
  };
}

export function demoClaimInfo(
  slug: string,
): { name: string; slug: string; claimed: boolean; website: string | null } | null {
  const c = COMPANIES.find((x) => x.slug === slug);
  return c
    ? {
        name: c.name,
        slug: c.slug,
        claimed: false,
        website: `https://www.${c.slug}.es`,
      }
    : null;
}

export function demoSiteStats() {
  return {
    companies: COMPANIES.length,
    cities: CITY_SLUGS.length,
    provinces: demoProvinces().length,
    categories: FEATURED_CATEGORIES.length,
  };
}
