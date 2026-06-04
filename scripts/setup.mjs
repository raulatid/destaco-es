#!/usr/bin/env node
/**
 * Destaco.es — instalacion automatica.
 * Uso:  npm run setup
 */
import { existsSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";

const log = (msg) => console.log(`\x1b[36m›\x1b[0m ${msg}`);
const ok = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
const run = (cmd) => {
  console.log(`\x1b[90m$ ${cmd}\x1b[0m`);
  execSync(cmd, { stdio: "inherit" });
};

console.log("\n  Destaco.es — instalacion automatica\n");

// 1. Variables de entorno
if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  ok("Creado .env desde .env.example (revisa tus claves)");
} else {
  ok(".env ya existe");
}

// 2. Dependencias
log("Instalando dependencias...");
run("npm install");

// 3. Infraestructura (PostgreSQL + Redis)
log("Levantando PostgreSQL + Redis con Docker...");
try {
  run("docker compose up -d");
} catch {
  console.warn("\n  No se pudo arrancar Docker. Arranca PostgreSQL y Redis manualmente y reintenta.\n");
  process.exit(1);
}

// 4. Esperar a la base de datos
log("Esperando a PostgreSQL...");
let ready = false;
for (let i = 0; i < 30 && !ready; i++) {
  try {
    execSync("docker compose exec -T postgres pg_isready -U destaco -d destaco", { stdio: "ignore" });
    ready = true;
  } catch {
    execSync("sleep 2");
  }
}
if (!ready) {
  console.warn("\n  PostgreSQL no respondio a tiempo. Reintenta `npm run db:push` manualmente.\n");
  process.exit(1);
}
ok("PostgreSQL listo");

// 5. Esquema + datos demo
log("Generando cliente Prisma y aplicando el esquema...");
run("npx prisma generate");
run("npx prisma db push");

log("Cargando datos demo...");
run("npm run db:seed");

console.log("\n");
ok("Instalacion completada");
console.log("\n  Arranca el proyecto con:  \x1b[1mnpm run dev\x1b[0m\n");
