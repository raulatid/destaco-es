import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

/**
 * Lista de correos con acceso de administrador. Quien inicie sesion con uno de
 * estos emails obtiene el rol ADMIN automaticamente (aunque en la BD figure
 * como USER). Se puede ampliar con la variable de entorno ADMIN_EMAILS
 * (separada por comas) sin tocar el codigo.
 */
export const ADMIN_EMAILS: ReadonlySet<string> = new Set(
  ["rauldiaztapia@gmail.com", ...(process.env.ADMIN_EMAILS ?? "").split(",")]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

/** True si el email pertenece a la lista de administradores. */
export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email) && ADMIN_EMAILS.has(email!.toLowerCase());
}

/**
 * Configuracion de Auth.js v5.
 * Proveedores: Google OAuth + email/password (Credentials).
 * Sesiones JWT (necesario para el proveedor Credentials).
 * El control de acceso se hace a nivel de layout (ver src/app/admin/layout.tsx).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Confiar en el host de la peticion (Vercel/proxy) para derivar las URLs de
  // callback. Sin esto, Auth.js cae a http://localhost:3000 y el login OAuth
  // de Google falla con redirect_uri_mismatch en produccion.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "USER";
      }
      // Eleva a ADMIN si el correo esta en la lista (vale tambien para sesiones
      // ya existentes: se aplica en cada refresco del token).
      if (isAdminEmail(token.email)) {
        token.role = "ADMIN";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
