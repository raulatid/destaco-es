import { Prisma } from "@prisma/client";

/**
 * Ejecuta una consulta a la base de datos. Si PostgreSQL no esta disponible
 * o el esquema aun no se ha aplicado (proyecto sin BD configurada todavia),
 * cae al catalogo demo para que el sitio funcione como prototipo navegable.
 *
 * Cualquier otro error se propaga con normalidad.
 */
export async function withFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      return fallback();
    }
    throw error;
  }
}
