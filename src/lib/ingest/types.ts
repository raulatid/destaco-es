/**
 * Tipos compartidos del pipeline de ingesta.
 * Cada fuente (Google Places, OpenStreetMap, open data) normaliza sus
 * resultados a `NormalizedCompany` antes de tocar la base de datos.
 */

export type IngestSourceKey = "GOOGLE_PLACES" | "OPENSTREETMAP";

export type OpeningHours = Record<string, [string, string][]>;

export interface NormalizedCompany {
  source: IngestSourceKey;
  /** Identificador en la fuente (place_id, node/123...). */
  sourceId: string;
  sourceUrl?: string;
  name: string;
  /** Slug de categoria de nuestra taxonomia (o null si no se pudo mapear). */
  categorySlug: string | null;
  shortDescription?: string;
  website?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  postalCode?: string;
  cityName?: string;
  provinceName?: string;
  latitude?: number;
  longitude?: number;
  ratingAvg?: number;
  reviewCount?: number;
  openingHours?: OpeningHours;
  /** URL de la foto principal (Google Places Photo / lh3.googleusercontent). */
  coverImage?: string;
}

export interface IngestStats {
  found: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}
