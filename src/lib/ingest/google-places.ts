/**
 * Cliente de Google Places API (New) — Text Search.
 * Fuente legal y oficial. Docs: https://developers.google.com/maps/documentation/places/web-service
 */
import { cleanWebsiteUrl } from "../utils";
import { categorizeGoogle } from "./categorize";
import { cleanCityName, cleanProvinceName } from "./geo";
import type { NormalizedCompany, OpeningHours } from "./types";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.primaryType",
  "places.types",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.regularOpeningHours",
  "places.addressComponents",
  "places.editorialSummary",
  "places.photos",
  "nextPageToken",
].join(",");

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

interface TimePoint {
  day: number;
  hour: number;
  minute: number;
}
interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { periods?: { open?: TimePoint; close?: TimePoint }[] };
  addressComponents?: { longText?: string; shortText?: string; types?: string[] }[];
  editorialSummary?: { text?: string };
  photos?: { name?: string }[];
}

const pad = (n: number) => String(n).padStart(2, "0");

function convertHours(
  periods?: { open?: TimePoint; close?: TimePoint }[],
): OpeningHours | undefined {
  if (!periods?.length) return undefined;
  const hours: OpeningHours = {};
  for (const period of periods) {
    if (!period.open) continue;
    const key = DAY_KEYS[period.open.day] ?? "mon";
    const open = `${pad(period.open.hour ?? 0)}:${pad(period.open.minute ?? 0)}`;
    const close = period.close
      ? `${pad(period.close.hour ?? 0)}:${pad(period.close.minute ?? 0)}`
      : "24:00";
    (hours[key] ??= []).push([open, close]);
  }
  return hours;
}

function findComponent(
  components: GooglePlace["addressComponents"],
  type: string,
): string | undefined {
  return components?.find((c) => c.types?.includes(type))?.longText;
}

function normalize(place: GooglePlace): NormalizedCompany | null {
  if (!place.id || !place.displayName?.text) return null;
  const components = place.addressComponents;

  return {
    source: "GOOGLE_PLACES",
    sourceId: place.id,
    sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    name: place.displayName.text,
    categorySlug: categorizeGoogle(place.primaryType, place.types),
    shortDescription: place.editorialSummary?.text,
    website: cleanWebsiteUrl(place.websiteUri) ?? undefined,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
    addressLine: place.formattedAddress,
    postalCode: findComponent(components, "postal_code"),
    cityName: cleanCityName(
      findComponent(components, "locality") ??
        findComponent(components, "postal_town"),
    ),
    provinceName: cleanProvinceName(
      findComponent(components, "administrative_area_level_2"),
    ),
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    ratingAvg: place.rating,
    reviewCount: place.userRatingCount,
    openingHours: convertHours(place.regularOpeningHours?.periods),
  };
}

const PHOTO_MAX_WIDTH = 800;

/**
 * Resuelve una referencia de foto de Places (New) a una URL mostrable.
 * Con `skipHttpRedirect=true` la API devuelve JSON con `photoUri`, una URL de
 * googleusercontent SIN la API key — segura para usar en <img> del frontend.
 * OJO: esa photoUri CADUCA (Google la revoca pasadas unas semanas, 403), por
 * eso guardamos tambien la referencia `name` y la refrescamos con el cron.
 */
export async function resolvePhotoUri(
  name: string,
  apiKey: string,
): Promise<string | undefined> {
  try {
    const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&skipHttpRedirect=true&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { photoUri?: string };
    return data.photoUri;
  } catch {
    return undefined;
  }
}

/**
 * Recupera la referencia de la primera foto de un place (Place Details, solo el
 * campo `photos`). Se usa para sanar fichas antiguas importadas sin referencia.
 */
export async function fetchFirstPhotoRef(
  placeId: string,
  apiKey: string,
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "photos",
        },
      },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { photos?: { name?: string }[] };
    return data.photos?.[0]?.name ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Busca empresas en Google Places por texto libre (ej. "dentistas en Valencia").
 * Pagina automaticamente hasta alcanzar `limit`.
 */
export async function searchGooglePlaces(
  query: string,
  limit = 40,
): Promise<NormalizedCompany[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GOOGLE_PLACES_API_KEY en el entorno.");
  }

  const results: NormalizedCompany[] = [];
  let pageToken: string | undefined;

  while (results.length < limit) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "es",
        regionCode: "ES",
        pageSize: 20,
        ...(pageToken ? { pageToken } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Google Places API ${response.status}: ${body.slice(0, 400)}`,
      );
    }

    const data = (await response.json()) as {
      places?: GooglePlace[];
      nextPageToken?: string;
    };

    for (const place of data.places ?? []) {
      const normalized = normalize(place);
      if (!normalized) continue;
      const photoName = place.photos?.[0]?.name;
      if (photoName) {
        normalized.coverImage = await resolvePhotoUri(photoName, apiKey);
        normalized.coverImageRef = photoName;
      }
      results.push(normalized);
    }

    pageToken = data.nextPageToken;
    if (!pageToken || !data.places?.length) break;
  }

  return results.slice(0, limit);
}
