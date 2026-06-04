import { Prisma } from "@prisma/client";

/**
 * El catalogo demo (empresas inventadas) solo tiene sentido cuando el proyecto
 * AUN NO tiene base de datos configurada: permite navegar el sitio como
 * prototipo. En cuanto hay `DATABASE_URL`, jamas debemos mostrar datos falsos.
 */
const DB_CONFIGURED = Boolean(process.env.DATABASE_URL);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ejecuta una consulta a la base de datos.
 *
 * - Sin `DATABASE_URL` (prototipo): devuelve el catalogo demo.
 * - Con BD configurada: ejecuta la consulta real. Si falla por un error de
 *   conexion (p. ej. Supabase despertando de la pausa del plan free) reintenta
 *   una vez. NUNCA cae a datos demo, porque mostrar empresas inventadas en
 *   produccion confunde al usuario y ademas genera 404 al abrir sus fichas
 *   (sus slugs no existen en la BD). Cualquier error real se propaga.
 */
export async function withFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (!DB_CONFIGURED) {
    return fallback();
  }

  try {
    return await run();
  } catch (error) {
    // Posible cold start de Supabase (free tier) o timeout puntual del pool:
    // un unico reintento tras una breve espera antes de propagar el error.
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2024")
    ) {
      await sleep(500);
      return await run();
    }
    throw error;
  }
}
