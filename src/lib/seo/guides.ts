/**
 * Generador de GUIAS de categoria ("Como elegir {nicho}").
 *
 * Cada categoria del catalogo tiene una guia editorial larga y UNICA. A
 * diferencia de las landings (listados), la guia es contenido de fondo: explica
 * que mirar, cuanto cuesta y que errores evitar al contratar ese tipo de
 * empresa. Sirve para captar busquedas informacionales ("como elegir un
 * fontanero") y para enlazar internamente hacia el directorio.
 *
 * Para no caer en "thin/duplicate content" entre las ~147 guias, el texto:
 *  - teje datos propios de la categoria (su descripcion, su nicho, sus
 *    especialidades reales y el numero de empresas), y
 *  - varia de forma DETERMINISTA por slug (un hash elige redacciones y rota el
 *    orden de los puntos), de modo que dos guias no se leen igual.
 * Mismo slug => mismo texto (estable para ISR/cache).
 */
import { nounArticle, nounIsFeminine } from "../constants";

/** Hash estable FNV-1a de una cadena -> entero sin signo de 32 bits. */
function seedFromString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Elige un elemento de `arr` de forma determinista a partir de una clave. */
function pickVariant<T>(arr: T[], key: string): T {
  return arr[seedFromString(key) % arr.length];
}

/** Rota un array de forma determinista (cambia el orden, no el contenido). */
function rotate<T>(arr: T[], key: string): T[] {
  if (arr.length < 2) return arr;
  const offset = seedFromString(key) % arr.length;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
}

export interface GuideBullet {
  term: string;
  detail: string;
}

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: GuideBullet[];
}

export interface CategoryGuide {
  /** H1 de la guia. */
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
}

export interface CategoryGuideInput {
  slug: string;
  noun: string;
  description?: string | null;
  count: number;
  /** Nombres legibles de las especialidades (subcategorias), si las hay. */
  specialties?: string[];
}

/** Genera la guia editorial de una categoria. */
export function categoryGuide(input: CategoryGuideInput): CategoryGuide {
  const { slug, noun, description, count, specialties = [] } = input;
  const year = new Date().getFullYear();
  const art = nounArticle(noun, true); // los / las
  const g = nounIsFeminine(noun) ? "a" : "o";
  const k = (suffix: string) => `${slug}|${suffix}`;

  const title = `Como elegir ${noun}: precios, claves y errores a evitar (${year})`;
  const metaTitle = `Como elegir ${noun} en ${year}: guia, precios y consejos`;
  const metaDescription = `Guia para contratar ${art} mejores ${noun}: que mirar, cuanto cuesta, errores frecuentes y como comparar presupuestos. Actualizada en ${year}.`;

  // ---- Introduccion (2 parrafos) ----
  const descSentence = description ? ` ${description}` : "";
  const introOpeners = [
    `Elegir ${noun} no siempre es facil: hay mucha oferta y no toda la misma calidad.${descSentence}`,
    `Contratar ${noun} es una decision importante y conviene compararlos bien antes de decidir.${descSentence}`,
    `Antes de contratar ${noun}, merece la pena saber en que fijarse para acertar.${descSentence}`,
  ];
  const introCount =
    count > 0
      ? [
          `En Destaco reunimos ${count} ${noun} de toda España, con sus valoraciones, servicios y datos de contacto, para que compares con criterio.`,
          `Listamos ${count} ${noun} en toda España ordenad${g}s por reseñas reales y por nuestro indice de calidad, asi que partes con informacion fiable.`,
        ]
      : [
          `En Destaco ampliamos cada dia el directorio de ${noun} con nuevas fichas verificadas para que puedas compararlas.`,
        ];
  const introClose = [
    `En esta guia te contamos que tener en cuenta, cuanto suele costar y que errores evitar al contratar ${noun}.`,
    `Esta guia resume las claves para elegir bien: criterios, precios orientativos y los fallos mas habituales.`,
  ];
  const intro = [
    `${pickVariant(introOpeners, k("io"))} ${pickVariant(introCount, k("ic"))}`,
    pickVariant(introClose, k("il")),
  ];

  // ---- Seccion: como elegir (criterios) ----
  const criteria: GuideBullet[] = rotate(
    [
      {
        term: "Experiencia y especializacion",
        detail: `Revisa cuanto tiempo llevan trabajando y si estan especializad${g}s en lo que necesitas. La trayectoria y los proyectos publicados dicen mucho.`,
      },
      {
        term: "Valoraciones y opiniones reales",
        detail: `Lee las reseñas verificadas y fijate tanto en la nota media como en el numero de opiniones: una buena media con muchas valoraciones es la señal mas fiable.`,
      },
      {
        term: "Presupuesto claro y por escrito",
        detail: `Pide siempre un presupuesto detallado y sin compromiso. Compara al menos dos o tres y desconfia de las cifras muy por debajo del mercado.`,
      },
      {
        term: "Cercania y cobertura",
        detail: `Un proveedor cercano suele responder antes y conocer mejor la zona. En Destaco puedes filtrar ${noun} por ciudad y provincia.`,
      },
      {
        term: "Comunicacion y trato",
        detail: `Valora la rapidez y la claridad con la que responden desde el primer contacto: es un buen indicador del servicio que recibiras despues.`,
      },
      {
        term: "Garantias y respaldo",
        detail: `Comprueba que ofrecen garantia por escrito, seguro de responsabilidad y, cuando aplique, la titulacion o el registro profesional correspondiente.`,
      },
    ],
    k("cr"),
  );
  const chooseSection: GuideSection = {
    heading: `Como elegir ${noun}: las claves`,
    paragraphs: [
      `No te quedes solo con el precio. Para acertar al contratar ${noun}, conviene mirar varios factores en conjunto:`,
    ],
    bullets: criteria,
  };

  // ---- Seccion: precios ----
  const priceSection: GuideSection = {
    heading: `Cuanto cuesta contratar ${noun}`,
    paragraphs: [
      pickVariant(
        [
          `No hay un precio unico: depende del alcance del trabajo, la urgencia, la experiencia del profesional y la zona. Por eso lo mejor es pedir varios presupuestos y compararlos sobre la misma base.`,
          `El coste varia mucho segun el tipo de servicio, su complejidad y la zona. La forma mas fiable de hacerte una idea es solicitar dos o tres presupuestos detallados y compararlos punto por punto.`,
        ],
        k("pr"),
      ),
      `Al comparar, asegurate de que cada presupuesto incluye lo mismo (materiales, desplazamientos, IVA y posibles extras). El mas barato no siempre sale mejor: un trabajo mal hecho acaba costando mas. Revisa tambien las reseñas antes de decidir.`,
    ],
  };

  // ---- Seccion: errores frecuentes ----
  const mistakes: GuideBullet[] = rotate(
    [
      {
        term: "Quedarte con el primer presupuesto",
        detail: `Sin comparar, es facil pagar de mas o contratar a quien no encaja con lo que necesitas.`,
      },
      {
        term: "Elegir solo por precio",
        detail: `Una oferta muy baja suele esconder materiales peores, prisas o sobrecostes posteriores.`,
      },
      {
        term: "No leer las opiniones",
        detail: `Las reseñas de otros clientes avisan de problemas recurrentes que no veras en la web del proveedor.`,
      },
      {
        term: "No dejar nada por escrito",
        detail: `Acuerda plazos, alcance y precio por escrito para evitar malentendidos y reclamaciones.`,
      },
      {
        term: "Olvidar las garantias",
        detail: `Confirma que garantia tienes si algo falla y durante cuanto tiempo antes de empezar.`,
      },
    ],
    k("mk"),
  );
  const mistakesSection: GuideSection = {
    heading: `Errores frecuentes al contratar ${noun}`,
    paragraphs: [
      `Estos son los fallos que mas se repiten y que puedes evitar facilmente:`,
    ],
    bullets: mistakes,
  };

  const sections: GuideSection[] = [chooseSection, priceSection, mistakesSection];

  // ---- Seccion: especialidades (si la categoria tiene subnichos) ----
  if (specialties.length > 0) {
    const list =
      specialties.length === 1
        ? specialties[0]
        : `${specialties.slice(0, -1).join(", ")} y ${specialties[specialties.length - 1]}`;
    sections.push({
      heading: `Tipos y especialidades de ${noun}`,
      paragraphs: [
        `No tod${g}s ${art} ${noun} hacen lo mismo. Segun lo que necesites, te interesara una especialidad u otra: ${list}. Elegir bien la especialidad es la mitad del trabajo; en Destaco puedes ir directo a cada una.`,
      ],
    });
  }

  // ---- FAQs propias de la guia (distintas de las del listado) ----
  const faqs = [
    {
      question: `¿Cuando conviene contratar ${noun}?`,
      answer: `Siempre que el trabajo requiera conocimientos o medios especificos. Contratar ${noun} con experiencia te ahorra tiempo, reduce riesgos y suele salir mas rentable que improvisar.`,
    },
    {
      question: `¿Como se si ${art} ${noun} son de confianza?`,
      answer: `Fijate en las valoraciones verificadas, el numero de opiniones, los proyectos publicados y que ofrezcan presupuesto y garantia por escrito. En Destaco cada ficha reune esta informacion para que la compares de un vistazo.`,
    },
    {
      question: `¿Cuantos presupuestos conviene pedir?`,
      answer: `Lo ideal son dos o tres presupuestos detallados sobre la misma base. Asi detectas precios fuera de mercado y comparas que incluye realmente cada uno.`,
    },
    {
      question: `¿Es mejor contratar ${noun} cerca de mi ciudad?`,
      answer: `Suele ayudar: la cercania agiliza la respuesta y abarata desplazamientos. En Destaco puedes filtrar ${noun} por ciudad y provincia para encontrar opciones proximas.`,
    },
  ];

  return { title, metaTitle, metaDescription, intro, sections, faqs };
}
