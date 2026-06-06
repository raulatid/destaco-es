"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export type CompanyFormState = { error?: string };

const CURRENT_YEAR = new Date().getFullYear();

const CompanySchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  categorySlug: z.string().min(1, "Selecciona una categoria."),
  shortDescription: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  website: z
    .string()
    .url("La web no es una URL valida.")
    .or(z.literal(""))
    .optional(),
  phone: z.string().max(40).optional(),
  email: z
    .string()
    .email("El email no es valido.")
    .or(z.literal(""))
    .optional(),
  addressLine: z.string().max(200).optional(),
  postalCode: z.string().max(10).optional(),
  provinceSlug: z.string().optional(),
  cityName: z.string().max(120).optional(),
  founded: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z
      .number()
      .int()
      .min(1800, "El ano de fundacion no es valido.")
      .max(CURRENT_YEAR, "El ano de fundacion no puede ser futuro.")
      .optional(),
  ),
  size: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.enum(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).optional(),
  ),
  priceFrom: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z
      .number()
      .int()
      .min(0, "El precio no puede ser negativo.")
      .max(10_000_000, "El precio no es valido.")
      .optional(),
  ),
  services: z.string().max(4000).optional(),
});

/** Convierte el textarea de servicios (uno por linea) en filas Service. */
function parseServices(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((name, order) => ({ name: name.slice(0, 120), order }));
}

async function uniqueSlug(name: string, city?: string): Promise<string> {
  const base = slugify(city ? `${name}-${city}` : name) || "empresa";
  let slug = base;
  let suffix = 2;
  while (
    await prisma.company.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

async function resolveLocation(provinceSlug?: string, cityName?: string) {
  let provinceId: string | null = null;
  let cityId: string | null = null;

  if (provinceSlug) {
    const province = await prisma.province.findUnique({
      where: { slug: provinceSlug },
      select: { id: true },
    });
    provinceId = province?.id ?? null;
  }
  if (cityName && provinceId) {
    const citySlug = slugify(cityName);
    const city = await prisma.city.findFirst({
      where: { slug: citySlug, provinceId },
      select: { id: true },
    });
    cityId = city
      ? city.id
      : (
          await prisma.city.create({
            data: { name: cityName, slug: citySlug, provinceId },
            select: { id: true },
          })
        ).id;
  }
  return { provinceId, cityId };
}

export async function createCompany(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Debes iniciar sesion." };

  const parsed = CompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no validos." };
  }
  const d = parsed.data;

  const category = await prisma.category.findUnique({
    where: { slug: d.categorySlug },
    select: { id: true },
  });
  if (!category) return { error: "La categoria seleccionada no existe." };

  const { provinceId, cityId } = await resolveLocation(
    d.provinceSlug,
    d.cityName,
  );

  // Anti-duplicados: una persona no puede registrar la misma empresa dos veces.
  // Comparamos por nombre (insensible a mayusculas) y ciudad. Si ya existe en
  // el directorio, invitamos a reclamar la ficha en lugar de crear otra.
  const existingCompany = await prisma.company.findFirst({
    where: {
      name: { equals: d.name, mode: "insensitive" },
      ...(cityId ? { cityId } : {}),
    },
    select: { ownerId: true, slug: true },
  });
  if (existingCompany) {
    if (existingCompany.ownerId === session.user.id) {
      return { error: "Ya tienes registrada esta empresa." };
    }
    return {
      error:
        "Esta empresa ya existe en el directorio. Reclama su ficha desde su pagina en lugar de crear una nueva.",
    };
  }

  const slug = await uniqueSlug(d.name, d.cityName);

  await prisma.company.create({
    data: {
      slug,
      name: d.name,
      categoryId: category.id,
      shortDescription: d.shortDescription || null,
      description: d.description || null,
      website: d.website || null,
      phone: d.phone || null,
      email: d.email || null,
      addressLine: d.addressLine || null,
      postalCode: d.postalCode || null,
      founded: d.founded ?? null,
      size: d.size ?? null,
      priceFrom: d.priceFrom ?? null,
      provinceId,
      cityId,
      ownerId: session.user.id,
      source: "CLAIMED",
      status: "PENDING",
      services: { create: parseServices(d.services) },
    },
  });

  revalidatePath("/dashboard/empresas");
  redirect("/dashboard/empresas");
}

export async function updateCompany(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Debes iniciar sesion." };

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.company.findUnique({
    where: { id },
    select: { ownerId: true, slug: true },
  });
  if (!existing || existing.ownerId !== session.user.id) {
    return { error: "No tienes permiso para editar esta empresa." };
  }

  const parsed = CompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no validos." };
  }
  const d = parsed.data;

  const category = await prisma.category.findUnique({
    where: { slug: d.categorySlug },
    select: { id: true },
  });
  if (!category) return { error: "La categoria seleccionada no existe." };

  const { provinceId, cityId } = await resolveLocation(
    d.provinceSlug,
    d.cityName,
  );

  await prisma.company.update({
    where: { id },
    data: {
      name: d.name,
      categoryId: category.id,
      shortDescription: d.shortDescription || null,
      description: d.description || null,
      website: d.website || null,
      phone: d.phone || null,
      email: d.email || null,
      addressLine: d.addressLine || null,
      postalCode: d.postalCode || null,
      founded: d.founded ?? null,
      size: d.size ?? null,
      priceFrom: d.priceFrom ?? null,
      provinceId,
      cityId,
      services: { deleteMany: {}, create: parseServices(d.services) },
    },
  });

  revalidatePath("/dashboard/empresas");
  revalidatePath(`/empresa/${existing.slug}`);
  redirect("/dashboard/empresas");
}
