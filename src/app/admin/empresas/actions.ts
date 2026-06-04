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

export async function approveCompany(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.company.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
}

export async function rejectCompany(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.company.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
}
