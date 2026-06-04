"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/ingest/geo";

export type ProjectState = { error?: string; success?: boolean };

const ProjectSchema = z.object({
  title: z.string().min(3, "El titulo es obligatorio.").max(120),
  description: z.string().max(2000).optional(),
  client: z.string().max(120).optional(),
  result: z.string().max(500).optional(),
  url: z.string().url("URL no valida.").max(300).optional().or(z.literal("")),
  coverImage: z.string().url("Imagen no valida.").max(500).optional().or(z.literal("")),
  date: z.string().optional(),
});

/** Verifica que el usuario es propietario de la empresa. */
async function assertOwner(companyId: string, userId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, ownerId: userId },
    select: { id: true, slug: true },
  });
  return company;
}

export async function createProject(
  companyId: string,
  _prev: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const session = await auth();
  if (!session?.user) return { error: "Inicia sesion." };

  const company = await assertOwner(companyId, session.user.id);
  if (!company) return { error: "No tienes permisos sobre esta empresa." };

  const parsed = ProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    client: formData.get("client") || undefined,
    result: formData.get("result") || undefined,
    url: formData.get("url") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    date: formData.get("date") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no validos." };
  }

  const base = toSlug(parsed.data.title) || "proyecto";
  let slug = base;
  let n = 2;
  while (
    await prisma.project.findFirst({
      where: { companyId, slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${n++}`;
  }

  await prisma.project.create({
    data: {
      companyId,
      slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      client: parsed.data.client || null,
      result: parsed.data.result || null,
      url: parsed.data.url || null,
      coverImage: parsed.data.coverImage || null,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
    },
  });

  revalidatePath(`/dashboard/empresas/${companyId}/proyectos`);
  revalidatePath(`/empresa/${company.slug}`);
  return { success: true };
}

export async function deleteProject(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const projectId = formData.get("projectId");
  const companyId = formData.get("companyId");
  if (typeof projectId !== "string" || typeof companyId !== "string") return;

  const company = await assertOwner(companyId, session.user.id);
  if (!company) return;

  await prisma.project.deleteMany({ where: { id: projectId, companyId } });
  revalidatePath(`/dashboard/empresas/${companyId}/proyectos`);
  revalidatePath(`/empresa/${company.slug}`);
}
