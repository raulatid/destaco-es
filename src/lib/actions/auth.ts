"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export type AuthState = { error?: string };

const RegisterSchema = z.object({
  name: z.string().min(2, "El nombre es demasiado corto."),
  email: z.string().email("El email no es valido."),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
});

export async function loginUser(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contrasena incorrectos." };
    }
    throw error;
  }
  return {};
}

export async function registerUser(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no validos." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password), role: "USER" },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Cuenta creada. Inicia sesion para continuar." };
    }
    throw error;
  }
  return {};
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
