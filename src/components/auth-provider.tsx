"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Provee la sesion al cliente (header) sin leer cookies en el layout del
 * servidor. Asi el layout deja de ser dinamico y las paginas de contenido
 * (fichas de empresa, home, categorias...) se sirven estaticas/ISR: mucho mas
 * rapidas y mejor para SEO. El header obtiene la sesion via useSession().
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
