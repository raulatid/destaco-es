import type { CompanySize, FeaturedScope } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Orden de los tamanos de empresa para selects de formulario. */
export const COMPANY_SIZES: CompanySize[] = [
  "SOLO",
  "SMALL",
  "MEDIUM",
  "LARGE",
  "ENTERPRISE",
];

/** Etiqueta legible del tamano de plantilla (numero de trabajadores). */
export const COMPANY_SIZE_LABEL: Record<CompanySize, string> = {
  SOLO: "Autonomo (1 persona)",
  SMALL: "2-10 trabajadores",
  MEDIUM: "11-50 trabajadores",
  LARGE: "51-200 trabajadores",
  ENTERPRISE: "Mas de 200 trabajadores",
};

/** Rango numerico de empleados por tamano (para schema.org numberOfEmployees). */
export const COMPANY_SIZE_RANGE: Record<
  CompanySize,
  { min: number; max?: number }
> = {
  SOLO: { min: 1, max: 1 },
  SMALL: { min: 2, max: 10 },
  MEDIUM: { min: 11, max: 50 },
  LARGE: { min: 51, max: 200 },
  ENTERPRISE: { min: 201 },
};

/** Orden de los alcances del destacado para el selector. */
export const FEATURED_SCOPES: FeaturedScope[] = [
  "LOCAL",
  "PROVINCIAL",
  "NACIONAL",
];

/** Etiqueta corta del alcance del destacado. */
export const FEATURED_SCOPE_LABEL: Record<FeaturedScope, string> = {
  LOCAL: "Tu localidad",
  PROVINCIAL: "Tu provincia",
  NACIONAL: "Toda España",
};

/** Descripcion del alcance del destacado (para el selector). */
export const FEATURED_SCOPE_HINT: Record<FeaturedScope, string> = {
  LOCAL: "Destaca solo en tu ciudad. Ideal para negocios de barrio.",
  PROVINCIAL: "Destaca en toda tu provincia.",
  NACIONAL: "Maxima visibilidad en todo el pais.",
};

const DIACRITICS = /[̀-ͯ]/g;

/** Convierte un texto en un slug seguro para URLs (sin acentos). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Formatea un numero grande de forma compacta: 12500 -> "12,5 mil". */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Formatea una valoracion media: 4 -> "4,0". */
export function formatRating(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Normaliza una URL de web: garantiza protocolo, elimina parametros de
 * seguimiento (utm_*, gclid, fbclid, etc.), el fragmento y la barra final.
 * Devuelve null si la entrada no es una URL valida. Sirve para el `href` real
 * (no mostramos ni enlazamos las URLs sucias de Google Business Profile).
 */
export function cleanWebsiteUrl(raw?: string | null): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Version legible de una web: sin protocolo, sin `www.` ni barra final. */
export function displayWebsite(raw?: string | null): string | null {
  const clean = cleanWebsiteUrl(raw);
  if (!clean) return null;
  return clean.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

/** Devuelve solo el dominio (host sin `www.`) de una web. Null si no es valida. */
export function websiteDomain(raw?: string | null): string | null {
  const clean = cleanWebsiteUrl(raw);
  if (!clean) return null;
  try {
    return new URL(clean).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

/**
 * Compone una direccion legible evitando duplicar el codigo postal o la ciudad
 * cuando ya vienen incluidos en `addressLine` (Google devuelve la direccion
 * completa en `formattedAddress`). Tambien elimina el pais sobrante.
 */
export function formatAddress(parts: {
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
}): string | null {
  const line = parts.addressLine?.trim();
  if (line) {
    return line.replace(/,?\s*(España|Espana|Spain)\s*$/i, "").trim();
  }
  const segs = [parts.postalCode, parts.city]
    .map((s) => s?.trim())
    .filter(Boolean) as string[];
  return segs.length ? segs.join(", ") : null;
}
