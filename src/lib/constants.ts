/**
 * Destaco.es — constantes globales y catalogo de referencia.
 * Los recuentos reales se calculan desde la base de datos (src/lib/data/).
 */

export const SITE = {
  name: "Destaco.es",
  domain: "destaco.es",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://destaco.es",
  tagline: "El directorio empresarial mas moderno de Espana",
  description:
    "Descubre, compara y contacta con las mejores empresas de Espana. " +
    "Miles de negocios verificados por provincia, ciudad y categoria.",
  locale: "es-ES",
  twitter: "@destaco_es",
} as const;

export type CategoryMeta = {
  slug: string;
  name: string;
  /** Clave de icono — ver components/category-icon.tsx */
  icon: string;
  description: string;
};

export const FEATURED_CATEGORIES: CategoryMeta[] = [
  {
    slug: "marketing",
    name: "Marketing y Publicidad",
    icon: "megaphone",
    description: "Agencias, branding, SEO y campanas digitales.",
  },
  {
    slug: "abogados",
    name: "Abogados y Asesoria",
    icon: "scale",
    description: "Despachos, fiscal, laboral y mercantil.",
  },
  {
    slug: "dentistas",
    name: "Clinicas Dentales",
    icon: "stethoscope",
    description: "Odontologia, ortodoncia e implantes.",
  },
  {
    slug: "restaurantes",
    name: "Restaurantes",
    icon: "utensils",
    description: "Cocina local, gourmet y para llevar.",
  },
  {
    slug: "reformas",
    name: "Reformas y Construccion",
    icon: "hammer",
    description: "Obra, albaniles, fontaneros y electricistas.",
  },
  {
    slug: "tecnologia",
    name: "Tecnologia y Software",
    icon: "code",
    description: "Desarrollo, IT, ciberseguridad y SaaS.",
  },
  {
    slug: "inmobiliarias",
    name: "Inmobiliarias",
    icon: "home",
    description: "Compra, venta y alquiler de inmuebles.",
  },
  {
    slug: "belleza",
    name: "Belleza y Estetica",
    icon: "scissors",
    description: "Peluquerias, estetica, spa y unas.",
  },
  {
    slug: "formacion",
    name: "Formacion y Academias",
    icon: "graduation-cap",
    description: "Academias, idiomas y formacion profesional.",
  },
  {
    slug: "automocion",
    name: "Automocion",
    icon: "car",
    description: "Talleres, concesionarios y recambios.",
  },
  {
    slug: "fitness",
    name: "Deporte y Fitness",
    icon: "dumbbell",
    description: "Gimnasios, entrenadores y centros deportivos.",
  },
  {
    slug: "fotografia",
    name: "Fotografia y Video",
    icon: "camera",
    description: "Estudios, bodas, producto y eventos.",
  },
];

export type ProvinceMeta = { slug: string; name: string };

export const TOP_PROVINCES: ProvinceMeta[] = [
  { slug: "madrid", name: "Madrid" },
  { slug: "barcelona", name: "Barcelona" },
  { slug: "valencia", name: "Valencia" },
  { slug: "sevilla", name: "Sevilla" },
  { slug: "malaga", name: "Malaga" },
  { slug: "vizcaya", name: "Vizcaya" },
  { slug: "alicante", name: "Alicante" },
  { slug: "zaragoza", name: "Zaragoza" },
];

export const TOP_CITIES: { slug: string; name: string }[] = [
  { slug: "madrid", name: "Madrid" },
  { slug: "barcelona", name: "Barcelona" },
  { slug: "valencia", name: "Valencia" },
  { slug: "sevilla", name: "Sevilla" },
  { slug: "malaga", name: "Malaga" },
  { slug: "bilbao", name: "Bilbao" },
  { slug: "zaragoza", name: "Zaragoza" },
  { slug: "alicante", name: "Alicante" },
];

export const NAV_LINKS = [
  { label: "Categorias", href: "/categorias" },
  { label: "Empresas", href: "/empresas" },
  { label: "Provincias", href: "/provincias" },
  { label: "Precios", href: "/precios" },
  { label: "Blog", href: "/blog" },
] as const;
