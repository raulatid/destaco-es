/**
 * Destaco.es — Algoritmo de ranking propio.
 *
 * `calculateBusinessRankingScore` combina senales de calidad, reputacion,
 * actividad y frescura en una puntuacion comparable entre empresas dentro de
 * un mismo listado (nicho/localidad). La puntuacion se cachea en
 * `Company.rankingScore` y se ordena por ella en las landing programaticas,
 * pero el usuario tambien puede reordenar por reseñas, visitas o recientes.
 *
 * La formula es deliberadamente explicable: cada termino esta acotado para
 * que ninguna senal por si sola domine el resultado y para evitar que un
 * negocio sin reseñas pero con muchas visitas adelante a uno con reputacion
 * solida.
 */

/** Senales necesarias para puntuar una empresa. */
export interface RankingInput {
  ratingAvg: number; // 0-5
  reviewCount: number;
  projectCount: number;
  verified: boolean;
  // Engagement
  viewCount: number;
  websiteClicks: number;
  phoneClicks: number;
  emailClicks: number;
  contactClicks: number;
  // Frescura
  lastRefreshedAt?: Date | null;
  lastEnrichedAt?: Date | null;
  updatedAt?: Date | null;
  createdAt?: Date | null;
  // Completitud del perfil (campos rellenos)
  completion: ProfileCompletionInput;
}

/** Campos que cuentan para la completitud del perfil. */
export interface ProfileCompletionInput {
  hasDescription: boolean;
  hasLogo: boolean;
  hasCover: boolean;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
  hasOpeningHours: boolean;
  serviceCount: number;
  imageCount: number;
}

export interface RankingBreakdown {
  score: number;
  rating: number;
  reviews: number;
  projects: number;
  verified: number;
  completion: number;
  engagement: number;
  freshness: number;
  penalty: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const DAY_MS = 86_400_000;

/**
 * Completitud del perfil en escala 0-100. Cada campo aporta un peso; los
 * servicios e imagenes aportan de forma decreciente para premiar el primero
 * sin exigir un catalogo enorme.
 */
export function computeCompletionScore(c: ProfileCompletionInput): number {
  let s = 0;
  if (c.hasDescription) s += 22;
  if (c.hasLogo) s += 12;
  if (c.hasCover) s += 8;
  if (c.hasWebsite) s += 12;
  if (c.hasPhone) s += 12;
  if (c.hasEmail) s += 8;
  if (c.hasAddress) s += 10;
  if (c.hasOpeningHours) s += 6;
  s += clamp(c.serviceCount, 0, 3) * 2; // hasta +6
  s += clamp(c.imageCount, 0, 4); // hasta +4
  return clamp(Math.round(s), 0, 100);
}

/**
 * Frescura 0-1: 1 si los datos se actualizaron hoy, decae linealmente hasta 0
 * a los 180 dias. Usa la fecha mas reciente disponible.
 */
function freshnessFactor(input: RankingInput): number {
  const dates = [
    input.lastRefreshedAt,
    input.lastEnrichedAt,
    input.updatedAt,
    input.createdAt,
  ].filter((d): d is Date => d instanceof Date);
  if (dates.length === 0) return 0;
  const newest = Math.max(...dates.map((d) => d.getTime()));
  const ageDays = (Date.now() - newest) / DAY_MS;
  return clamp(1 - ageDays / 180, 0, 1);
}

/**
 * Puntuacion de ranking de una empresa. Devuelve el desglose completo para
 * poder auditar y guardar snapshots.
 */
export function calculateBusinessRankingScore(
  input: RankingInput,
): RankingBreakdown {
  // Reputacion: la media solo pesa cuando hay un minimo de reseñas, para que
  // un unico 5/5 no dispare el ranking (suavizado bayesiano simple).
  const PRIOR = 3.5; // media a priori del directorio
  const WEIGHT = 5; // "reseñas equivalentes" del prior
  const bayesianRating =
    (input.ratingAvg * input.reviewCount + PRIOR * WEIGHT) /
    (input.reviewCount + WEIGHT);
  const rating = bayesianRating * 25; // ~0-125

  const reviews = Math.log10(input.reviewCount + 1) * 15;
  const projects = Math.log10(input.projectCount + 1) * 10;
  const verified = input.verified ? 15 : 0;

  const completionPct = computeCompletionScore(input.completion);
  const completion = (completionPct / 100) * 20; // 0-20

  // Engagement: ponderamos mas los clics de intencion (web/telefono/contacto)
  // que las visitas. Logaritmico para acotar outliers.
  const weightedEngagement =
    input.viewCount * 0.2 +
    input.websiteClicks * 1 +
    input.phoneClicks * 1.2 +
    input.emailClicks * 1 +
    input.contactClicks * 1.5;
  const engagement = clamp(Math.log10(weightedEngagement + 1) * 8, 0, 24);

  const freshness = freshnessFactor(input) * 10; // 0-10

  // Penalizaciones por baja calidad / perfil pobre.
  let penalty = 0;
  if (completionPct < 30) penalty += 15;
  if (input.reviewCount === 0) penalty += 5;
  if (!input.completion.hasDescription) penalty += 5;

  const score =
    rating +
    reviews +
    projects +
    verified +
    completion +
    engagement +
    freshness -
    penalty;

  return {
    score: Math.round(clamp(score, 0, 1000) * 100) / 100,
    rating: Math.round(rating * 100) / 100,
    reviews: Math.round(reviews * 100) / 100,
    projects: Math.round(projects * 100) / 100,
    verified,
    completion: Math.round(completion * 100) / 100,
    engagement: Math.round(engagement * 100) / 100,
    freshness: Math.round(freshness * 100) / 100,
    penalty,
  };
}

/** Opciones de ordenacion expuestas en los listados. */
export const SORT_OPTIONS = {
  score: "Mejor valoradas (Destaco)",
  rating: "Mayor puntuacion",
  reviews: "Mas reseñas",
  views: "Mas visitadas",
  recent: "Mas recientes",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export function isSortOption(value: unknown): value is SortOption {
  return typeof value === "string" && value in SORT_OPTIONS;
}
