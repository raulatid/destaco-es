"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ReviewState = { error?: string; success?: boolean };

const ReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z
    .string()
    .min(10, "La resena debe tener al menos 10 caracteres.")
    .max(2000),
});

/**
 * Envia una resena. Se crea en estado PENDING — la modera el administrador.
 * `slug` se pasa con .bind() desde el formulario.
 */
export async function submitReview(
  slug: string,
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Inicia sesion para escribir una resena." };
  }

  const parsed = ReviewSchema.safeParse({
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no validos." };
  }

  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!company) return { error: "Empresa no encontrada." };

  const existing = await prisma.review.findFirst({
    where: { companyId: company.id, authorId: session.user.id },
    select: { id: true },
  });
  if (existing) {
    return { error: "Ya has publicado una resena para esta empresa." };
  }

  await prisma.review.create({
    data: {
      companyId: company.id,
      authorId: session.user.id,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "PENDING",
    },
  });

  revalidatePath(`/empresa/${slug}`);
  return { success: true };
}
