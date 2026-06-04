/**
 * Destaco.es — seed de datos de referencia.
 * Carga: 52 provincias, ciudades principales, categorias y un usuario
 * administrador. Las empresas reales se obtienen con la ingesta
 * (scripts/ingest.ts) — aqui no se cargan empresas de demostracion.
 *
 * Ejecutar:  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

import { FEATURED_CATEGORIES } from "../src/lib/constants";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

function slug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-");
}

// [codigo INE, nombre, comunidad autonoma]
const PROVINCES: [string, string, string][] = [
  ["01", "Alava", "Pais Vasco"],
  ["02", "Albacete", "Castilla-La Mancha"],
  ["03", "Alicante", "Comunidad Valenciana"],
  ["04", "Almeria", "Andalucia"],
  ["05", "Avila", "Castilla y Leon"],
  ["06", "Badajoz", "Extremadura"],
  ["07", "Baleares", "Islas Baleares"],
  ["08", "Barcelona", "Cataluna"],
  ["09", "Burgos", "Castilla y Leon"],
  ["10", "Caceres", "Extremadura"],
  ["11", "Cadiz", "Andalucia"],
  ["12", "Castellon", "Comunidad Valenciana"],
  ["13", "Ciudad Real", "Castilla-La Mancha"],
  ["14", "Cordoba", "Andalucia"],
  ["15", "A Coruna", "Galicia"],
  ["16", "Cuenca", "Castilla-La Mancha"],
  ["17", "Girona", "Cataluna"],
  ["18", "Granada", "Andalucia"],
  ["19", "Guadalajara", "Castilla-La Mancha"],
  ["20", "Guipuzcoa", "Pais Vasco"],
  ["21", "Huelva", "Andalucia"],
  ["22", "Huesca", "Aragon"],
  ["23", "Jaen", "Andalucia"],
  ["24", "Leon", "Castilla y Leon"],
  ["25", "Lleida", "Cataluna"],
  ["26", "La Rioja", "La Rioja"],
  ["27", "Lugo", "Galicia"],
  ["28", "Madrid", "Comunidad de Madrid"],
  ["29", "Malaga", "Andalucia"],
  ["30", "Murcia", "Region de Murcia"],
  ["31", "Navarra", "Comunidad Foral de Navarra"],
  ["32", "Ourense", "Galicia"],
  ["33", "Asturias", "Principado de Asturias"],
  ["34", "Palencia", "Castilla y Leon"],
  ["35", "Las Palmas", "Canarias"],
  ["36", "Pontevedra", "Galicia"],
  ["37", "Salamanca", "Castilla y Leon"],
  ["38", "Santa Cruz de Tenerife", "Canarias"],
  ["39", "Cantabria", "Cantabria"],
  ["40", "Segovia", "Castilla y Leon"],
  ["41", "Sevilla", "Andalucia"],
  ["42", "Soria", "Castilla y Leon"],
  ["43", "Tarragona", "Cataluna"],
  ["44", "Teruel", "Aragon"],
  ["45", "Toledo", "Castilla-La Mancha"],
  ["46", "Valencia", "Comunidad Valenciana"],
  ["47", "Valladolid", "Castilla y Leon"],
  ["48", "Vizcaya", "Pais Vasco"],
  ["49", "Zamora", "Castilla y Leon"],
  ["50", "Zaragoza", "Aragon"],
  ["51", "Ceuta", "Ceuta"],
  ["52", "Melilla", "Melilla"],
];

// [ciudad, provincia, lat, lng, poblacion]
const CITIES: [string, string, number, number, number][] = [
  ["Madrid", "Madrid", 40.4168, -3.7038, 3300000],
  ["Barcelona", "Barcelona", 41.3874, 2.1686, 1620000],
  ["Valencia", "Valencia", 39.4699, -0.3763, 800000],
  ["Sevilla", "Sevilla", 37.3891, -5.9845, 688000],
  ["Malaga", "Malaga", 36.7213, -4.4214, 578000],
  ["Bilbao", "Vizcaya", 43.263, -2.935, 346000],
  ["Zaragoza", "Zaragoza", 41.6488, -0.8891, 675000],
  ["Alicante", "Alicante", 38.3452, -0.481, 337000],
  ["Murcia", "Murcia", 37.9922, -1.1307, 460000],
  ["Granada", "Granada", 37.1773, -3.5986, 232000],
];

async function main() {
  console.log("Seed Destaco.es — iniciando...");

  // 1. Provincias
  for (const [ineCode, name, community] of PROVINCES) {
    await prisma.province.upsert({
      where: { ineCode },
      update: { name, autonomousCommunity: community },
      create: {
        ineCode,
        name,
        slug: slug(name),
        autonomousCommunity: community,
        metaTitle: `Empresas en ${name} | Destaco.es`,
        metaDescription: `Directorio de empresas en la provincia de ${name}. Encuentra negocios verificados por categoria y ciudad.`,
      },
    });
  }
  console.log(`  ${PROVINCES.length} provincias`);

  // 2. Ciudades
  for (const [name, provinceName, lat, lng, population] of CITIES) {
    const province = await prisma.province.findUnique({
      where: { ineCode: PROVINCES.find((p) => p[1] === provinceName)![0] },
    });
    if (!province) continue;
    await prisma.city.upsert({
      where: { provinceId_slug: { provinceId: province.id, slug: slug(name) } },
      update: { latitude: lat, longitude: lng, population },
      create: {
        name,
        slug: slug(name),
        provinceId: province.id,
        latitude: lat,
        longitude: lng,
        population,
        metaTitle: `Empresas en ${name} | Destaco.es`,
        metaDescription: `Las mejores empresas de ${name}. Directorio local verificado y enriquecido con IA.`,
      },
    });
  }
  console.log(`  ${CITIES.length} ciudades`);

  // 3. Categorias
  for (const [i, cat] of FEATURED_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        order: i,
        featured: true,
        metaTitle: `${cat.name} en Espana | Destaco.es`,
        metaDescription: `Directorio de ${cat.name.toLowerCase()}. ${cat.description}`,
      },
    });
  }
  console.log(`  ${FEATURED_CATEGORIES.length} categorias`);

  // 4. Recuento por categoria
  for (const cat of await prisma.category.findMany()) {
    const count = await prisma.company.count({ where: { categoryId: cat.id } });
    await prisma.category.update({
      where: { id: cat.id },
      data: { companyCount: count },
    });
  }

  // 6. Usuario administrador
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Destaco2026!";
  await prisma.user.upsert({
    where: { email: "admin@destaco.es" },
    update: { role: "ADMIN", passwordHash: hashPassword(adminPassword) },
    create: {
      email: "admin@destaco.es",
      name: "Administrador",
      role: "ADMIN",
      passwordHash: hashPassword(adminPassword),
    },
  });
  console.log(
    `  1 usuario administrador — admin@destaco.es / ${adminPassword}`,
  );

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
