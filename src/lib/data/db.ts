import { Prisma } from "@prisma/client";

/**
 * El catalogo demo (empresas inventadas) solo tiene sentido cuando el proyecto
 * AUN NO tiene base de datos configurada: permite navegar el sitio como
 * prototipo. En cuanto hay `DATABASE_URL`, jamas debemos mostrar datos falsos.
 */
const DB_CONFIGURED = Boolean(process.env.DATABASE_URL);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Errores tipicos de "blip" de conexion en entorno serverless (Vercel) contra
 * Supabase: cold start del pooler, pool agotado, conexion cerrada por el
 * servidor o timeout puntual. Son transitorios y merecen reintento; el resto
 * (errores de validacion, de esquema, etc.) se propaga sin reintentar.
 */
function isTransientDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2024 pool timeout · P1001 no alcanzable · P1002 timeout ·
    // P1008 operacion agotada · P1017 el servidor cerro la conexion.
    return ["P2024", "P1001", "P1002", "P1008", "P1017"].includes(error.code);
  }
  // El driver envuelve a veces cierres de conexion como Unknown.
  if (error instanceof Prisma.PrismaClientUnknownRequestError) return true;
  return false;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [250, 750];

/**
 * Ejecuta una consulta a la base de datos.
 *
 * - Sin `DATABASE_URL` (prototipo): devuelve el catalogo demo.
 * - Con BD configurada: ejecuta la consulta real. Si falla por un error de
 *   conexion transitorio (Supabase despertando, pool agotado, conexion cerrada
 *   en un cold start) reintenta hasta {@link MAX_ATTEMPTS} veces con espera
 *   creciente. NUNCA cae a datos demo, porque mostrar empresas inventadas en
 *   produccion confunde al usuario y ademas genera 404 al abrir sus fichas
 *   (sus slugs no existen en la BD). Si todos los intentos fallan, se propaga.
 */
export async function withFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (!DB_CONFIGURED) {
    return fallback();
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === MAX_ATTEMPTS - 1) break;
      await sleep(BACKOFF_MS[attempt] ?? 750);
    }
  }
  throw lastError;
}
