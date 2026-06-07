"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

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

/**
 * Elimina cualquier empresa (accion de administrador). Cancela primero la
 * suscripcion de Stripe (best-effort) para que no se siga cobrando y borra la
 * ficha; las filas hijas se eliminan en cascada por el esquema.
 */
export async function deleteCompany(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      slug: true,
      subscription: { select: { stripeSubscriptionId: true } },
    },
  });
  if (!company) return;

  const subId = company.subscription?.stripeSubscriptionId;
  if (subId) {
    try {
      await getStripe().subscriptions.cancel(subId);
    } catch (error) {
      console.error(
        "[admin] no se pudo cancelar la suscripcion en Stripe:",
        error,
      );
    }
  }

  await prisma.company.delete({ where: { id } });

  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
  revalidatePath(`/empresa/${company.slug}`);
}
