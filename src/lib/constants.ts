/**
 * Destaco.es — constantes globales y catalogo de referencia.
 * Los recuentos reales se calculan desde la base de datos (src/lib/data/).
 */

export const SITE = {
  name: "Destaco.es",
  domain: "destaco.es",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://destaco.es",
  tagline: "Directorio de empresas que destacan",
  description:
    "Descubre, compara y contacta con las mejores empresas de Espana. " +
    "Miles de negocios verificados por provincia, ciudad y categoria.",
  locale: "es-ES",
  twitter: "@destaco_es",
} as const;

/**
 * Titular del sitio y datos para los textos legales (aviso legal, privacidad,
 * cookies, terminos). Fuente unica de verdad — las paginas de /legal los leen.
 */
export const LEGAL = {
  ownerName: "Raúl Díaz Tapia",
  nif: "21067209Z",
  address: "Paseo la Fuente N.º 9, 4.º A",
  email: "raul@vertigomkt.com",
} as const;

export type CategoryMeta = {
  slug: string;
  name: string;
  /** Clave de icono — ver components/category-icon.tsx */
  icon: string;
  description: string;
};

/**
 * Catalogo maestro de categorias — UNICA fuente de verdad.
 *
 * De aqui se derivan: el seed de la BD (categorias + landings), el nicho de
 * busqueda SEO (`noun`), las consultas del importador diario y el mapeo de
 * tipos de Google Places a categoria. Segmentamos mucho (cada nicho = su propia
 * categoria) para generar muchas mas URLs programaticas y captar long-tail.
 *
 * Campos:
 *  - `noun`        nicho real que la gente teclea ("agencias de marketing"), NO
 *                  el nombre de catalogo. Posiciona y alinea importador <-> SEO.
 *  - `featured`    aparece en la home; el resto sale en /categorias.
 *  - `googleTypes` tipos de Google Places (New) que mapean AQUI. Cada tipo debe
 *                  ser unico en todo el catalogo (un tipo -> una categoria).
 */
export type Category = CategoryMeta & {
  noun: string;
  featured: boolean;
  googleTypes: string[];
  /**
   * Slug de la categoria madre. Si esta presente, esta categoria es una
   * SUBCATEGORIA (nicho fino, p. ej. "agencias-seo" bajo "marketing"). Las
   * URLs siguen siendo planas (/agencias-seo, /agencias-seo/madrid); el padre
   * solo agrupa para navegacion/breadcrumbs y para AGREGAR a sus hijas en su
   * propia landing (/marketing muestra tambien las empresas de sus nichos).
   */
  parent?: string;
};

export const CATEGORIES: Category[] = [
  // --- Destacadas (home) ---
  {
    slug: "marketing",
    name: "Marketing y Publicidad",
    icon: "megaphone",
    description: "Agencias, branding, SEO y campanas digitales.",
    noun: "agencias de marketing",
    featured: true,
    googleTypes: ["marketing_agency", "advertising_agency", "marketing_consultant"],
  },
  {
    slug: "abogados",
    name: "Abogados",
    icon: "scale",
    description: "Despachos fiscal, laboral, mercantil y penal.",
    noun: "abogados",
    featured: true,
    googleTypes: ["lawyer", "legal_services"],
  },
  {
    slug: "dentistas",
    name: "Clinicas Dentales",
    icon: "stethoscope",
    description: "Odontologia, ortodoncia e implantes.",
    noun: "clinicas dentales",
    featured: true,
    googleTypes: ["dentist", "dental_clinic"],
  },
  {
    slug: "restaurantes",
    name: "Restaurantes",
    icon: "utensils",
    description: "Cocina local, gourmet y para llevar.",
    noun: "restaurantes",
    featured: true,
    googleTypes: ["restaurant", "meal_takeaway", "meal_delivery", "food"],
  },
  {
    slug: "reformas",
    name: "Reformas y Construccion",
    icon: "hammer",
    description: "Obra, albaniles y reformas integrales.",
    noun: "reformas integrales",
    featured: true,
    googleTypes: ["general_contractor", "roofing_contractor"],
  },
  {
    slug: "tecnologia",
    name: "Tecnologia y Software",
    icon: "code",
    description: "Desarrollo, IT, ciberseguridad y SaaS.",
    noun: "empresas de informática",
    featured: true,
    googleTypes: [],
  },
  {
    slug: "inmobiliarias",
    name: "Inmobiliarias",
    icon: "home",
    description: "Compra, venta y alquiler de inmuebles.",
    noun: "inmobiliarias",
    featured: true,
    googleTypes: ["real_estate_agency"],
  },
  {
    slug: "belleza",
    name: "Centros de Estetica",
    icon: "sparkles",
    description: "Estetica facial y corporal, depilacion y unas.",
    noun: "centros de estética",
    featured: true,
    googleTypes: ["beauty_salon"],
  },
  {
    slug: "formacion",
    name: "Formacion y Academias",
    icon: "graduation-cap",
    description: "Academias, colegios y formacion profesional.",
    noun: "academias",
    featured: true,
    googleTypes: ["school", "primary_school", "secondary_school", "university"],
  },
  {
    slug: "automocion",
    name: "Talleres Mecanicos",
    icon: "car",
    description: "Reparacion, mantenimiento y recambios.",
    noun: "talleres mecánicos",
    featured: true,
    googleTypes: ["car_repair", "auto_parts_store"],
  },
  {
    slug: "fitness",
    name: "Gimnasios y Fitness",
    icon: "dumbbell",
    description: "Gimnasios, entrenadores y centros deportivos.",
    noun: "gimnasios",
    featured: true,
    googleTypes: ["gym", "fitness_center", "sports_club"],
  },
  {
    slug: "fotografia",
    name: "Fotografia y Video",
    icon: "camera",
    description: "Estudios, bodas, producto y eventos.",
    noun: "fotógrafos",
    featured: true,
    googleTypes: ["photographer"],
  },

  // --- Hosteleria ---
  {
    slug: "cafeterias",
    parent: "restaurantes",
    name: "Cafeterias",
    icon: "coffee",
    description: "Cafe de especialidad, desayunos y meriendas.",
    noun: "cafeterías",
    featured: false,
    googleTypes: ["cafe", "coffee_shop"],
  },
  {
    slug: "bares",
    parent: "restaurantes",
    name: "Bares y Pubs",
    icon: "beer",
    description: "Bares de tapas, cervecerias y pubs.",
    noun: "bares",
    featured: false,
    googleTypes: ["bar", "pub"],
  },
  {
    slug: "panaderias",
    parent: "restaurantes",
    name: "Panaderias y Pastelerias",
    icon: "croissant",
    description: "Pan artesano, bolleria y reposteria.",
    noun: "panaderías",
    featured: false,
    googleTypes: ["bakery"],
  },

  // --- Servicios profesionales ---
  {
    slug: "asesorias",
    name: "Asesorias y Gestorias",
    icon: "calculator",
    description: "Asesoria fiscal, contable y laboral.",
    noun: "asesorías y gestorías",
    featured: false,
    googleTypes: ["accounting"],
  },
  {
    slug: "seguros",
    name: "Correduria de Seguros",
    icon: "shield",
    description: "Seguros de hogar, salud, vida y empresa.",
    noun: "corredurías de seguros",
    featured: false,
    googleTypes: ["insurance_agency"],
  },
  {
    slug: "agencias-viajes",
    name: "Agencias de Viajes",
    icon: "plane",
    description: "Viajes a medida, circuitos y escapadas.",
    noun: "agencias de viajes",
    featured: false,
    googleTypes: ["travel_agency"],
  },

  // --- Belleza segmentada ---
  {
    slug: "peluquerias",
    parent: "belleza",
    name: "Peluquerias",
    icon: "scissors",
    description: "Corte, color, peinados y tratamientos.",
    noun: "peluquerías",
    featured: false,
    googleTypes: ["hair_salon", "hair_care"],
  },
  {
    slug: "barberias",
    parent: "belleza",
    name: "Barberias",
    icon: "scissors",
    description: "Corte de caballero, afeitado y arreglo de barba.",
    noun: "barberías",
    featured: false,
    googleTypes: ["barber_shop"],
  },
  {
    slug: "unas",
    parent: "belleza",
    name: "Manicura y Unas",
    icon: "hand",
    description: "Manicura, pedicura y unas esculpidas.",
    noun: "centros de manicura",
    featured: false,
    googleTypes: ["nail_salon"],
  },
  {
    slug: "spa",
    parent: "belleza",
    name: "Spa y Masajes",
    icon: "flower",
    description: "Spa, masajes y bienestar.",
    noun: "spa y masajes",
    featured: false,
    googleTypes: ["spa", "massage"],
  },

  // --- Salud ---
  {
    slug: "clinicas",
    name: "Clinicas y Medicos",
    icon: "heart-pulse",
    description: "Clinicas privadas y consultas medicas.",
    noun: "clínicas privadas",
    featured: false,
    googleTypes: ["doctor"],
  },
  {
    slug: "fisioterapia",
    name: "Fisioterapia",
    icon: "activity",
    description: "Fisioterapia, rehabilitacion y osteopatia.",
    noun: "fisioterapeutas",
    featured: false,
    googleTypes: ["physiotherapist"],
  },
  {
    slug: "veterinarios",
    name: "Veterinarios",
    icon: "paw",
    description: "Clinicas veterinarias y urgencias 24h.",
    noun: "clínicas veterinarias",
    featured: false,
    googleTypes: ["veterinary_care"],
  },
  {
    slug: "farmacias",
    name: "Farmacias",
    icon: "pill",
    description: "Farmacias y parafarmacias.",
    noun: "farmacias",
    featured: false,
    googleTypes: ["pharmacy"],
  },

  // --- Hogar y oficios ---
  {
    slug: "electricistas",
    parent: "reformas",
    name: "Electricistas",
    icon: "zap",
    description: "Instalaciones, averias y boletines.",
    noun: "electricistas",
    featured: false,
    googleTypes: ["electrician"],
  },
  {
    slug: "fontaneros",
    parent: "reformas",
    name: "Fontaneros",
    icon: "droplet",
    description: "Fontaneria, fugas y calefaccion.",
    noun: "fontaneros",
    featured: false,
    googleTypes: ["plumber"],
  },
  {
    slug: "pintores",
    parent: "reformas",
    name: "Pintores",
    icon: "paintbrush",
    description: "Pintura de interiores, fachadas y decoracion.",
    noun: "pintores",
    featured: false,
    googleTypes: ["painter"],
  },
  {
    slug: "cerrajeros",
    parent: "reformas",
    name: "Cerrajeros",
    icon: "key",
    description: "Apertura de puertas, cerraduras y urgencias.",
    noun: "cerrajeros",
    featured: false,
    googleTypes: ["locksmith"],
  },
  {
    slug: "mudanzas",
    name: "Mudanzas",
    icon: "truck",
    description: "Mudanzas, portes y guardamuebles.",
    noun: "empresas de mudanzas",
    featured: false,
    googleTypes: ["moving_company"],
  },
  {
    slug: "floristerias",
    name: "Floristerias",
    icon: "leaf",
    description: "Ramos, plantas y decoracion floral.",
    noun: "floristerías",
    featured: false,
    googleTypes: ["florist"],
  },
  {
    slug: "funerarias",
    name: "Funerarias",
    icon: "flower",
    description: "Servicios funerarios y tanatorios.",
    noun: "funerarias",
    featured: false,
    googleTypes: ["funeral_home"],
  },

  // --- Automocion segmentada ---
  {
    slug: "concesionarios",
    parent: "automocion",
    name: "Concesionarios",
    icon: "car",
    description: "Venta de coches nuevos y de ocasion.",
    noun: "concesionarios de coches",
    featured: false,
    googleTypes: ["car_dealer"],
  },
  {
    slug: "lavaderos",
    parent: "automocion",
    name: "Lavaderos de Coches",
    icon: "car",
    description: "Lavado, detailing y limpieza de vehiculos.",
    noun: "lavaderos de coches",
    featured: false,
    googleTypes: ["car_wash"],
  },

  // --- Formacion segmentada ---
  {
    slug: "idiomas",
    parent: "formacion",
    name: "Academias de Idiomas",
    icon: "languages",
    description: "Ingles, frances, aleman y mas idiomas.",
    noun: "academias de idiomas",
    featured: false,
    googleTypes: ["language_school"],
  },

  // ====== SUBCATEGORIAS (nichos finos, URLs planas) ======

  // --- marketing ---
  {
    slug: "agencias-seo",
    parent: "marketing",
    name: "Agencias SEO",
    icon: "megaphone",
    description: "Posicionamiento web y SEO tecnico.",
    noun: "agencias SEO",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "agencias-publicidad",
    parent: "marketing",
    name: "Agencias de Publicidad",
    icon: "megaphone",
    description: "Campanas SEM, display y medios.",
    noun: "agencias de publicidad",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "agencias-redes-sociales",
    parent: "marketing",
    name: "Agencias de Redes Sociales",
    icon: "megaphone",
    description: "Gestion de redes y community management.",
    noun: "agencias de redes sociales",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "agencias-diseno-web",
    parent: "marketing",
    name: "Agencias de Diseno Web",
    icon: "code",
    description: "Diseno y desarrollo de paginas web.",
    noun: "agencias de diseno web",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "agencias-branding",
    parent: "marketing",
    name: "Agencias de Branding",
    icon: "megaphone",
    description: "Identidad de marca y naming.",
    noun: "agencias de branding",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "agencias-email-marketing",
    parent: "marketing",
    name: "Agencias de Email Marketing",
    icon: "megaphone",
    description: "Automatizacion y campanas de email.",
    noun: "agencias de email marketing",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "agencias-comunicacion",
    parent: "marketing",
    name: "Agencias de Comunicacion",
    icon: "megaphone",
    description: "Comunicacion, RRPP y prensa.",
    noun: "agencias de comunicacion",
    featured: false,
    googleTypes: [],
  },

  // --- abogados ---
  {
    slug: "abogados-laboralistas",
    parent: "abogados",
    name: "Abogados Laboralistas",
    icon: "scale",
    description: "Derecho laboral y despidos.",
    noun: "abogados laboralistas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "abogados-penalistas",
    parent: "abogados",
    name: "Abogados Penalistas",
    icon: "scale",
    description: "Derecho penal y defensa.",
    noun: "abogados penalistas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "abogados-civil",
    parent: "abogados",
    name: "Abogados Civiles",
    icon: "scale",
    description: "Derecho civil y contratos.",
    noun: "abogados civilistas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "abogados-mercantil",
    parent: "abogados",
    name: "Abogados Mercantiles",
    icon: "scale",
    description: "Derecho mercantil y societario.",
    noun: "abogados mercantiles",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "abogados-familia",
    parent: "abogados",
    name: "Abogados de Familia",
    icon: "scale",
    description: "Divorcios, custodias y herencias.",
    noun: "abogados de familia",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "abogados-extranjeria",
    parent: "abogados",
    name: "Abogados de Extranjeria",
    icon: "scale",
    description: "Nacionalidad, visados y residencia.",
    noun: "abogados de extranjeria",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "abogados-fiscal",
    parent: "abogados",
    name: "Abogados Fiscalistas",
    icon: "scale",
    description: "Derecho tributario y fiscal.",
    noun: "abogados fiscalistas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "abogados-accidentes",
    parent: "abogados",
    name: "Abogados de Accidentes",
    icon: "scale",
    description: "Indemnizaciones y trafico.",
    noun: "abogados de accidentes de trafico",
    featured: false,
    googleTypes: [],
  },

  // --- dentistas ---
  {
    slug: "ortodoncistas",
    parent: "dentistas",
    name: "Ortodoncistas",
    icon: "stethoscope",
    description: "Ortodoncia y brackets invisibles.",
    noun: "ortodoncistas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "implantes-dentales",
    parent: "dentistas",
    name: "Implantes Dentales",
    icon: "stethoscope",
    description: "Implantologia y rehabilitacion oral.",
    noun: "clinicas de implantes dentales",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "estetica-dental",
    parent: "dentistas",
    name: "Estetica Dental",
    icon: "stethoscope",
    description: "Carillas y blanqueamientos.",
    noun: "clinicas de estetica dental",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "odontopediatras",
    parent: "dentistas",
    name: "Odontopediatras",
    icon: "stethoscope",
    description: "Odontologia infantil.",
    noun: "odontopediatras",
    featured: false,
    googleTypes: [],
  },

  // --- restaurantes ---
  {
    slug: "restaurantes-italianos",
    parent: "restaurantes",
    name: "Restaurantes Italianos",
    icon: "utensils",
    description: "Pasta, pizza y cocina italiana.",
    noun: "restaurantes italianos",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "restaurantes-japoneses",
    parent: "restaurantes",
    name: "Restaurantes Japoneses",
    icon: "utensils",
    description: "Sushi y cocina japonesa.",
    noun: "restaurantes japoneses",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "restaurantes-chinos",
    parent: "restaurantes",
    name: "Restaurantes Chinos",
    icon: "utensils",
    description: "Cocina china y asiatica.",
    noun: "restaurantes chinos",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "restaurantes-mexicanos",
    parent: "restaurantes",
    name: "Restaurantes Mexicanos",
    icon: "utensils",
    description: "Tacos y cocina mexicana.",
    noun: "restaurantes mexicanos",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "pizzerias",
    parent: "restaurantes",
    name: "Pizzerias",
    icon: "utensils",
    description: "Pizza al horno y para llevar.",
    noun: "pizzerias",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "hamburgueserias",
    parent: "restaurantes",
    name: "Hamburgueserias",
    icon: "utensils",
    description: "Hamburguesas gourmet y smash.",
    noun: "hamburgueserias",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "marisquerias",
    parent: "restaurantes",
    name: "Marisquerias",
    icon: "utensils",
    description: "Marisco y pescado fresco.",
    noun: "marisquerias",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "asadores",
    parent: "restaurantes",
    name: "Asadores",
    icon: "utensils",
    description: "Carnes a la brasa y parrilla.",
    noun: "asadores",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "restaurantes-vegetarianos",
    parent: "restaurantes",
    name: "Restaurantes Vegetarianos",
    icon: "utensils",
    description: "Cocina vegetariana y vegana.",
    noun: "restaurantes vegetarianos",
    featured: false,
    googleTypes: [],
  },

  // --- reformas ---
  {
    slug: "carpinteros",
    parent: "reformas",
    name: "Carpinteros",
    icon: "hammer",
    description: "Muebles a medida y madera.",
    noun: "carpinteros",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "albaniles",
    parent: "reformas",
    name: "Albaniles",
    icon: "hammer",
    description: "Obra, tabiqueria y solados.",
    noun: "albaniles",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "reformas-cocinas",
    parent: "reformas",
    name: "Reformas de Cocinas",
    icon: "hammer",
    description: "Diseno y reforma de cocinas.",
    noun: "reformas de cocinas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "reformas-banos",
    parent: "reformas",
    name: "Reformas de Banos",
    icon: "hammer",
    description: "Reforma integral de banos.",
    noun: "reformas de banos",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "climatizacion",
    parent: "reformas",
    name: "Climatizacion",
    icon: "hammer",
    description: "Aire acondicionado y calefaccion.",
    noun: "empresas de climatizacion",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "escayolistas",
    parent: "reformas",
    name: "Escayolistas y Pladur",
    icon: "hammer",
    description: "Techos, molduras y pladur.",
    noun: "escayolistas",
    featured: false,
    googleTypes: [],
  },

  // --- belleza ---
  {
    slug: "centros-depilacion",
    parent: "belleza",
    name: "Depilacion Laser",
    icon: "sparkles",
    description: "Depilacion laser y fotodepilacion.",
    noun: "centros de depilacion laser",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "centros-bronceado",
    parent: "belleza",
    name: "Centros de Bronceado",
    icon: "sparkles",
    description: "Rayos UVA y bronceado.",
    noun: "centros de bronceado",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "maquillaje",
    parent: "belleza",
    name: "Maquilladores",
    icon: "sparkles",
    description: "Maquillaje profesional y novias.",
    noun: "maquilladores profesionales",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "micropigmentacion",
    parent: "belleza",
    name: "Micropigmentacion",
    icon: "sparkles",
    description: "Microblading y cejas.",
    noun: "centros de micropigmentacion",
    featured: false,
    googleTypes: [],
  },

  // --- inmobiliarias ---
  {
    slug: "administradores-fincas",
    parent: "inmobiliarias",
    name: "Administradores de Fincas",
    icon: "home",
    description: "Gestion de comunidades de vecinos.",
    noun: "administradores de fincas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "tasaciones",
    parent: "inmobiliarias",
    name: "Tasaciones Inmobiliarias",
    icon: "home",
    description: "Tasacion y valoracion de inmuebles.",
    noun: "empresas de tasacion inmobiliaria",
    featured: false,
    googleTypes: [],
  },

  // --- tecnologia ---
  {
    slug: "desarrollo-software",
    parent: "tecnologia",
    name: "Desarrollo de Software",
    icon: "code",
    description: "Software a medida y aplicaciones.",
    noun: "empresas de desarrollo de software",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "desarrollo-apps",
    parent: "tecnologia",
    name: "Desarrollo de Apps",
    icon: "code",
    description: "Apps moviles iOS y Android.",
    noun: "empresas de desarrollo de apps",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "ciberseguridad",
    parent: "tecnologia",
    name: "Ciberseguridad",
    icon: "code",
    description: "Seguridad informatica y auditorias.",
    noun: "empresas de ciberseguridad",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "soporte-informatico",
    parent: "tecnologia",
    name: "Soporte Informatico",
    icon: "code",
    description: "Mantenimiento y soporte IT.",
    noun: "servicios de soporte informatico",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "consultoria-it",
    parent: "tecnologia",
    name: "Consultoria IT",
    icon: "code",
    description: "Consultoria y transformacion digital.",
    noun: "consultoras IT",
    featured: false,
    googleTypes: [],
  },

  // --- formacion ---
  {
    slug: "autoescuelas",
    parent: "formacion",
    name: "Autoescuelas",
    icon: "car",
    description: "Carnet de conducir y permisos.",
    noun: "autoescuelas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "academias-oposiciones",
    parent: "formacion",
    name: "Academias de Oposiciones",
    icon: "graduation-cap",
    description: "Preparacion de oposiciones.",
    noun: "academias de oposiciones",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "escuelas-musica",
    parent: "formacion",
    name: "Escuelas de Musica",
    icon: "graduation-cap",
    description: "Clases de musica e instrumentos.",
    noun: "escuelas de musica",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "escuelas-danza",
    parent: "formacion",
    name: "Escuelas de Danza",
    icon: "graduation-cap",
    description: "Ballet, baile moderno y flamenco.",
    noun: "escuelas de danza",
    featured: false,
    googleTypes: [],
  },

  // --- fitness ---
  {
    slug: "centros-yoga",
    parent: "fitness",
    name: "Centros de Yoga",
    icon: "dumbbell",
    description: "Yoga, meditacion y bienestar.",
    noun: "centros de yoga",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "centros-pilates",
    parent: "fitness",
    name: "Centros de Pilates",
    icon: "dumbbell",
    description: "Pilates maquina y suelo.",
    noun: "centros de pilates",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "centros-crossfit",
    parent: "fitness",
    name: "Boxes de CrossFit",
    icon: "dumbbell",
    description: "CrossFit y entrenamiento funcional.",
    noun: "boxes de crossfit",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "artes-marciales",
    parent: "fitness",
    name: "Artes Marciales",
    icon: "dumbbell",
    description: "Karate, judo, boxeo y MMA.",
    noun: "gimnasios de artes marciales",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "entrenadores-personales",
    parent: "fitness",
    name: "Entrenadores Personales",
    icon: "dumbbell",
    description: "Entrenamiento personal y coaching.",
    noun: "entrenadores personales",
    featured: false,
    googleTypes: [],
  },

  // --- fotografia ---
  {
    slug: "fotografos-bodas",
    parent: "fotografia",
    name: "Fotografos de Bodas",
    icon: "camera",
    description: "Reportaje de bodas y eventos.",
    noun: "fotografos de bodas",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "estudios-fotograficos",
    parent: "fotografia",
    name: "Estudios Fotograficos",
    icon: "camera",
    description: "Estudio, retrato y producto.",
    noun: "estudios fotograficos",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "videografos",
    parent: "fotografia",
    name: "Videografos",
    icon: "camera",
    description: "Video profesional y eventos.",
    noun: "videografos",
    featured: false,
    googleTypes: [],
  },

  // --- automocion ---
  {
    slug: "talleres-chapa-pintura",
    parent: "automocion",
    name: "Chapa y Pintura",
    icon: "car",
    description: "Carroceria, chapa y pintura.",
    noun: "talleres de chapa y pintura",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "neumaticos",
    parent: "automocion",
    name: "Neumaticos",
    icon: "car",
    description: "Venta y montaje de neumaticos.",
    noun: "talleres de neumaticos",
    featured: false,
    googleTypes: [],
  },
  {
    slug: "gruas",
    parent: "automocion",
    name: "Gruas y Asistencia",
    icon: "car",
    description: "Grua y asistencia en carretera.",
    noun: "servicios de grua",
    featured: false,
    googleTypes: [],
  },
];

/** Subconjunto destacado para la home (deriva del catalogo maestro). */
export const FEATURED_CATEGORIES: CategoryMeta[] = CATEGORIES.filter(
  (c) => c.featured,
).map((c) => ({
  slug: c.slug,
  name: c.name,
  icon: c.icon,
  description: c.description,
}));

/**
 * Termino "nicho" que la gente realmente teclea en Google, por categoria.
 * Derivado del catalogo maestro. NO es el nombre de catalogo ("Marketing y
 * Publicidad") sino la palabra clave de busqueda ("agencias de marketing"):
 * la usan los titulos/descripciones SEO de las landings Y las consultas del
 * importador, para que coincida lo que indexamos con lo que buscan los usuarios.
 */
export const CATEGORY_SEO_NOUN: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.noun]),
);

/**
 * Devuelve el nicho de busqueda de una categoria por su slug. Si no esta en el
 * mapa, cae al nombre de catalogo en minusculas.
 */
export function categoryNoun(slug: string, fallback = ""): string {
  return CATEGORY_SEO_NOUN[slug] ?? fallback.toLowerCase();
}

// ---- Concordancia de genero (Los/Las mejores ...) -------------------------
//
// El nicho (`noun`) puede ser masculino ("abogados" -> "Los mejores abogados")
// o femenino ("agencias SEO" -> "Las mejores agencias SEO"). Para no cometer
// errores gramaticales en titulos y metadatos, decidimos el articulo a partir
// de la PALABRA CABEZA del nicho (la primera). Lista explicita de cabezas
// femeninas + heuristica de respaldo para nichos que se añadan en el futuro.

const normalizeHead = (noun: string): string =>
  noun
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // quita acentos

/** Cabezas de nicho femeninas presentes en el catalogo. */
const FEMININE_NOUN_HEADS = new Set<string>([
  "academias",
  "agencias",
  "asesorias",
  "autoescuelas",
  "barberias",
  "cafeterias",
  "clinicas",
  "consultoras",
  "corredurias",
  "empresas",
  "escuelas",
  "farmacias",
  "floristerias",
  "funerarias",
  "hamburgueserias",
  "inmobiliarias",
  "marisquerias",
  "panaderias",
  "peluquerias",
  "pizzerias",
  "reformas",
]);

/** Cabezas comunes/ambiguas que tratamos como masculinas ("los ..."). */
const MASCULINE_NOUN_HEADS = new Set<string>([
  "spa",
  "electricistas",
  "escayolistas",
  "ortodoncistas",
  "fisioterapeutas",
  "odontopediatras",
  "dentistas",
]);

/** True si el nicho es femenino plural (-> "Las mejores ..."). */
export function nounIsFeminine(noun: string): boolean {
  const head = normalizeHead(noun);
  if (FEMININE_NOUN_HEADS.has(head)) return true;
  if (MASCULINE_NOUN_HEADS.has(head)) return false;
  // Respaldo para nichos futuros no listados:
  if (/istas$/.test(head)) return false; // profesiones -ista: "los ..."
  if (/(ias|cion|dad|tad|tud)$/.test(head)) return true;
  if (/as$/.test(head)) return true; // plural femenino generico
  return false; // por defecto, masculino
}

/** Articulo determinado plural concordado: "Los" o "Las". */
export function nounArticle(noun: string, lower = false): "Los" | "Las" | "los" | "las" {
  const art = nounIsFeminine(noun) ? "Las" : "Los";
  return (lower ? art.toLowerCase() : art) as "Los" | "Las" | "los" | "las";
}

/**
 * "Los/Las mejores {nicho}" con concordancia de genero.
 * @param lower pon en minuscula el articulo (para mitad de frase).
 */
export function bestNoun(noun: string, lower = false): string {
  return `${nounArticle(noun, lower)} mejores ${noun}`;
}

/** slug -> slug de su categoria madre (o undefined si es de primer nivel). */
export const CATEGORY_PARENT: Record<string, string | undefined> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.parent]));

/** Categorias de primer nivel (sin madre). */
export const TOP_LEVEL_CATEGORIES: Category[] = CATEGORIES.filter(
  (c) => !c.parent,
);

/** Subcategorias agrupadas por slug de su madre. */
export const SUBCATEGORIES_BY_PARENT: Record<string, Category[]> =
  CATEGORIES.reduce<Record<string, Category[]>>((acc, c) => {
    if (c.parent) (acc[c.parent] ??= []).push(c);
    return acc;
  }, {});

/** Devuelve las subcategorias (nichos) de una categoria madre. */
export function childCategories(parentSlug: string): Category[] {
  return SUBCATEGORIES_BY_PARENT[parentSlug] ?? [];
}

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
] as const;
