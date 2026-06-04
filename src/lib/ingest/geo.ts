/** Utilidades de normalizacion geografica para la ingesta. */

const DIACRITICS = /[̀-ͯ]/g;

export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normaliza el nombre de una provincia procedente de fuentes externas.
 * "Provincia de Valencia" / "Valencia/Valencia" -> "Valencia".
 */
export function cleanProvinceName(raw?: string): string | undefined {
  if (!raw) return undefined;
  let name = raw.trim();
  name = name.replace(/^provincia\s+de\s+/i, "");
  name = name.replace(/^província\s+de\s+/i, "");
  name = name.replace(/\s+province$/i, "");
  // Formatos bilingues tipo "Valencia/València" o "Araba/Álava".
  if (name.includes("/")) name = name.split("/")[0].trim();
  return name || undefined;
}

export function cleanCityName(raw?: string): string | undefined {
  if (!raw) return undefined;
  const name = raw.trim();
  return name || undefined;
}

/** Une calle y numero en una sola linea de direccion. */
export function composeAddress(parts: {
  street?: string;
  houseNumber?: string;
}): string | undefined {
  const { street, houseNumber } = parts;
  if (!street) return undefined;
  return houseNumber ? `${street}, ${houseNumber}` : street;
}
