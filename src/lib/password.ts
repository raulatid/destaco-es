import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contrasena con scrypt (incluido en Node, sin dependencias).
 * Formato almacenado: "salt:hash" en hexadecimal.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Verifica una contrasena contra un hash almacenado, en tiempo constante. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashed = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return (
    hashed.length === candidate.length && timingSafeEqual(hashed, candidate)
  );
}
