/**
 * Mapeo determinista de las taxonomias de las fuentes a las categorias
 * de Destaco.es. Rapido y gratis. (El refinamiento con IA es una etapa
 * posterior del pipeline: ENRICH.)
 */

// Tipos de lugar de Google Places (New) -> slug de categoria.
const GOOGLE_TYPE_MAP: Record<string, string> = {
  restaurant: "restaurantes",
  cafe: "restaurantes",
  bar: "restaurantes",
  bakery: "restaurantes",
  meal_takeaway: "restaurantes",
  meal_delivery: "restaurantes",
  food: "restaurantes",
  dentist: "dentistas",
  dental_clinic: "dentistas",
  lawyer: "abogados",
  legal_services: "abogados",
  accounting: "abogados",
  notary_public: "abogados",
  marketing_agency: "marketing",
  advertising_agency: "marketing",
  real_estate_agency: "inmobiliarias",
  beauty_salon: "belleza",
  hair_salon: "belleza",
  hair_care: "belleza",
  nail_salon: "belleza",
  spa: "belleza",
  school: "formacion",
  primary_school: "formacion",
  secondary_school: "formacion",
  university: "formacion",
  language_school: "formacion",
  car_repair: "automocion",
  car_dealer: "automocion",
  car_wash: "automocion",
  auto_parts_store: "automocion",
  gym: "fitness",
  fitness_center: "fitness",
  sports_club: "fitness",
  photographer: "fotografia",
  general_contractor: "reformas",
  electrician: "reformas",
  plumber: "reformas",
  painter: "reformas",
  roofing_contractor: "reformas",
};

export function categorizeGoogle(
  primaryType?: string,
  types?: string[],
): string | null {
  if (primaryType && GOOGLE_TYPE_MAP[primaryType]) {
    return GOOGLE_TYPE_MAP[primaryType];
  }
  for (const type of types ?? []) {
    if (GOOGLE_TYPE_MAP[type]) return GOOGLE_TYPE_MAP[type];
  }
  return null;
}

// Etiquetas de OpenStreetMap -> slug de categoria.
// Cada entrada: [clave, valor(es), slug].
const OSM_TAG_RULES: [string, string[], string][] = [
  ["amenity", ["restaurant", "cafe", "bar", "fast_food", "pub", "food_court"], "restaurantes"],
  ["amenity", ["dentist"], "dentistas"],
  ["healthcare", ["dentist"], "dentistas"],
  ["office", ["lawyer", "accountant", "tax_advisor", "notary"], "abogados"],
  ["amenity", ["lawyer"], "abogados"],
  ["office", ["advertising_agency", "marketing"], "marketing"],
  ["office", ["it", "telecommunication", "software"], "tecnologia"],
  ["office", ["estate_agent"], "inmobiliarias"],
  ["shop", ["estate_agent"], "inmobiliarias"],
  ["shop", ["hairdresser", "beauty", "nail", "cosmetics"], "belleza"],
  ["leisure", ["fitness_centre", "sports_centre"], "fitness"],
  ["amenity", ["gym"], "fitness"],
  ["amenity", ["school", "university", "college", "language_school", "driving_school"], "formacion"],
  ["shop", ["car", "car_repair", "car_parts", "tyres"], "automocion"],
  ["amenity", ["car_repair"], "automocion"],
  ["craft", ["photographer"], "fotografia"],
  ["shop", ["photo"], "fotografia"],
  ["craft", ["electrician", "plumber", "painter", "carpenter", "builder", "hvac"], "reformas"],
  ["shop", ["doityourself", "hardware", "trade"], "reformas"],
];

export function categorizeOsm(tags: Record<string, string>): string | null {
  for (const [key, values, slug] of OSM_TAG_RULES) {
    const tagValue = tags[key];
    if (tagValue && values.includes(tagValue)) return slug;
  }
  return null;
}

/** Filtros de etiquetas OSM por categoria, para construir consultas Overpass. */
export const OSM_QUERY_FILTERS: Record<string, string[]> = {
  restaurantes: ['"amenity"="restaurant"', '"amenity"="cafe"', '"amenity"="bar"'],
  dentistas: ['"amenity"="dentist"', '"healthcare"="dentist"'],
  abogados: ['"office"="lawyer"', '"office"="accountant"'],
  marketing: ['"office"="advertising_agency"', '"office"="marketing"'],
  tecnologia: ['"office"="it"', '"office"="software"'],
  inmobiliarias: ['"office"="estate_agent"', '"shop"="estate_agent"'],
  belleza: ['"shop"="hairdresser"', '"shop"="beauty"'],
  fitness: ['"leisure"="fitness_centre"', '"leisure"="sports_centre"'],
  formacion: ['"amenity"="school"', '"amenity"="language_school"'],
  automocion: ['"shop"="car"', '"shop"="car_repair"'],
  fotografia: ['"craft"="photographer"', '"shop"="photo"'],
  reformas: ['"craft"="electrician"', '"craft"="plumber"', '"shop"="doityourself"'],
};
