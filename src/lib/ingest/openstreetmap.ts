/**
 * Cliente de OpenStreetMap via Overpass API.
 * Fuente abierta y gratuita (datos ODbL). Sin clave.
 *
 * Estrategia: geocodificar el municipio con Nominatim para obtener su
 * bounding box (robusto frente a nombres locales/acentos), y luego consultar
 * Overpass dentro de esa caja.
 */
import { categorizeOsm, OSM_QUERY_FILTERS } from "./categorize";
import { cleanCityName, composeAddress } from "./geo";
import type { NormalizedCompany } from "./types";

const OVERPASS_ENDPOINT =
  process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Las APIs de OSM exigen un User-Agent identificativo.
const USER_AGENT = "Destaco.es/1.0 (directorio de empresas; +https://destaco.es)";

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** [sur, oeste, norte, este] */
type BoundingBox = [number, number, number, number];

/** Geocodifica un municipio espanol a su bounding box. */
async function geocodeArea(area: string): Promise<BoundingBox> {
  const url = `${NOMINATIM_ENDPOINT}?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(area)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Nominatim ${response.status} geocodificando "${area}".`);
  }
  const data = (await response.json()) as {
    boundingbox?: [string, string, string, string];
  }[];
  const box = data[0]?.boundingbox;
  if (!box) {
    throw new Error(`No se encontro el municipio "${area}" en OpenStreetMap.`);
  }
  // Nominatim devuelve [minLat, maxLat, minLon, maxLon].
  return [
    Number(box[0]),
    Number(box[2]),
    Number(box[1]),
    Number(box[3]),
  ];
}

function buildQuery(
  bbox: BoundingBox,
  categorySlug: string,
  limit: number,
): string {
  const filters = OSM_QUERY_FILTERS[categorySlug];
  if (!filters) {
    throw new Error(`Categoria sin filtros OSM definidos: ${categorySlug}`);
  }
  const box = bbox.join(",");
  const clauses = filters
    .map((filter) => `  nwr[${filter}]["name"](${box});`)
    .join("\n");

  return `[out:json][timeout:40];
(
${clauses}
);
out center tags ${limit};`;
}

function normalize(
  element: OsmElement,
  areaName: string,
): NormalizedCompany | null {
  const tags = element.tags ?? {};
  if (!tags.name) return null;

  return {
    source: "OPENSTREETMAP",
    sourceId: `${element.type}/${element.id}`,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    name: tags.name,
    categorySlug: categorizeOsm(tags),
    website: tags.website ?? tags["contact:website"],
    phone: tags.phone ?? tags["contact:phone"],
    email: tags.email ?? tags["contact:email"],
    addressLine: composeAddress({
      street: tags["addr:street"],
      houseNumber: tags["addr:housenumber"],
    }),
    postalCode: tags["addr:postcode"],
    cityName: cleanCityName(tags["addr:city"]) ?? cleanCityName(areaName),
    latitude: element.lat ?? element.center?.lat,
    longitude: element.lon ?? element.center?.lon,
  };
}

/**
 * Busca empresas de una categoria dentro de un municipio espanol.
 * `area` es el nombre del municipio (ej. "Valencia", "Alcobendas").
 */
export async function searchOpenStreetMap(
  area: string,
  categorySlug: string,
  limit = 60,
): Promise<NormalizedCompany[]> {
  const bbox = await geocodeArea(area);
  const query = buildQuery(bbox, categorySlug, limit);

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Overpass API ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { elements?: OsmElement[] };
  const results: NormalizedCompany[] = [];

  for (const element of data.elements ?? []) {
    const normalized = normalize(element, area);
    if (normalized) results.push(normalized);
  }

  return results;
}
