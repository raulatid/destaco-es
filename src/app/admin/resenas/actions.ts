"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("No autorizado.");
  }
}

/** Recalcula la valoracion media y el numero de resenas de una empresa. */
async function recomputeRating(companyId: string) {
  const agg = await prisma.review.aggregate({
    where: { companyId, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.company.update({
    where: { id: companyId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });
}

export async function approveReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const review = await prisma.review.update({
    where: { id },
    data: { status: "APPROVED" },
    select: { companyId: true },
  });
  await recomputeRating(review.companyId);
  revalidatePath("/admin/resenas");
  revalidatePath("/admin");
}

export async function rejectReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const review = await prisma.review.update({
    where: { id },
    data: { status: "REJECTED" },
    select: { companyId: true },
  });
  await recomputeRating(review.companyId);
  revalidatePath("/admin/resenas");
  revalidatePath("/admin");
}
