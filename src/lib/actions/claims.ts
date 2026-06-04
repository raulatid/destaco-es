"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";
import { sendEmail } from "@/lib/email/resend";
import {
  claimApprovedEmail,
  claimRejectedEmail,
  claimVerificationEmail,
} from "@/lib/email/templates";

const TOKEN_TTL_HOURS = 48;

export type ClaimState = { error?: string; success?: boolean; message?: string };

const ClaimSchema = z.object({
  email: z.string().email("Introduce un email valido."),
  evidence: z.string().max(1000).optional(),
});

/** Extrae el dominio (sin www) de una URL o un email. Null si no se puede. */
function extractDomain(value?: string | null): string | null {
  if (!value) return null;
  try {
    if (value.includes("@")) {
      return value.split("@")[1]?.toLowerCase().replace(/^www\./, "") ?? null;
    }
    const url = value.startsWith("http") ? value : `https://${value}`;
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Solicita reclamar un perfil. Genera un token temporal y envia un correo de
 * verificacion via Resend. Si el dominio del email coincide con el de la web
 * de la empresa, la reclamacion se marca como auto-aprobable (regla fuerte):
 * al verificar el email se aprueba automaticamente.
 */
export async function requestClaim(
  slug: string,
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Inicia sesion con Google para reclamar un perfil." };
  }

  const parsed = ClaimSchema.safeParse({
    email: formData.get("email"),
    evidence: formData.get("evidence") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no validos." };
  }

  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true, name: true, website: true, ownerId: true },
  });
  if (!company) return { error: "Empresa no encontrada." };
  if (company.ownerId) {
    return { error: "Este perfil ya tiene propietario." };
  }

  const emailDomain = extractDomain(parsed.data.email);
  const siteDomain = extractDomain(company.website);
  const domainMatch = Boolean(
    emailDomain && siteDomain && emailDomain === siteDomain,
  );

  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3_600_000);

  await prisma.companyClaim.upsert({
    where: { companyId_userId: { companyId: company.id, userId: session.user.id } },
    create: {
      companyId: company.id,
      userId: session.user.id,
      status: "PENDING",
      claimantEmail: parsed.data.email,
      domainMatch,
      evidence: parsed.data.evidence ?? null,
      token,
      tokenExpiresAt,
    },
    update: {
      status: "PENDING",
      claimantEmail: parsed.data.email,
      domainMatch,
      evidence: parsed.data.evidence ?? null,
      token,
      tokenExpiresAt,
      verifiedAt: null,
      resolvedAt: null,
    },
  });

  const verifyUrl = new URL(
    `/reclamar/verificar?token=${token}`,
    SITE.url,
  ).toString();
  const { subject, html } = claimVerificationEmail({
    companyName: company.name,
    verifyUrl,
    expiresHours: TOKEN_TTL_HOURS,
  });
  const sent = await sendEmail({
    to: parsed.data.email,
    subject,
    html,
    template: "claim-verification",
    metadata: { companyId: company.id, userId: session.user.id, domainMatch },
  });

  if (!sent.ok) {
    return {
      error:
        "No hemos podido enviar el correo de verificacion. Intentalo de nuevo en unos minutos.",
    };
  }

  return {
    success: true,
    message: `Te hemos enviado un email a ${parsed.data.email}. Abre el enlace para completar la reclamacion (caduca en ${TOKEN_TTL_HOURS} h).`,
  };
}

export type VerifyClaimResult =
  | { status: "approved"; companyName: string }
  | { status: "pending"; companyName: string }
  | { status: "expired" }
  | { status: "invalid" };

/**
 * Verifica el token de una reclamacion. Marca el email como verificado y, si
 * el dominio coincidia (regla fuerte), aprueba automaticamente: el usuario
 * pasa a propietario (rol BUSINESS). En caso contrario queda PENDING para
 * revision del admin.
 */
export async function verifyClaim(token: string): Promise<VerifyClaimResult> {
  if (!token) return { status: "invalid" };

  const claim = await prisma.companyClaim.findUnique({
    where: { token },
    include: { company: { select: { id: true, name: true, slug: true, ownerId: true } } },
  });
  if (!claim) return { status: "invalid" };

  if (claim.status === "APPROVED") {
    return { status: "approved", companyName: claim.company.name };
  }

  if (claim.tokenExpiresAt < new Date()) {
    if (claim.status !== "EXPIRED") {
      await prisma.companyClaim.update({
        where: { id: claim.id },
        data: { status: "EXPIRED" },
      });
    }
    return { status: "expired" };
  }

  // Email verificado.
  const verifiedAt = new Date();

  // Regla fuerte: dominio del email == dominio de la web -> auto-aprobacion.
  if (claim.domainMatch && !claim.company.ownerId) {
    await prisma.$transaction([
      prisma.companyClaim.update({
        where: { id: claim.id },
        data: { status: "APPROVED", verifiedAt, resolvedAt: verifiedAt },
      }),
      prisma.company.update({
        where: { id: claim.company.id },
        data: { ownerId: claim.userId, source: "CLAIMED", verified: true },
      }),
      prisma.user.update({
        where: { id: claim.userId },
        data: { role: "BUSINESS" },
      }),
    ]);

    const dashboardUrl = new URL("/dashboard", SITE.url).toString();
    const { subject, html } = claimApprovedEmail({
      companyName: claim.company.name,
      dashboardUrl,
    });
    await sendEmail({
      to: claim.claimantEmail,
      subject,
      html,
      template: "claim-approved",
      metadata: { companyId: claim.company.id },
    });

    revalidatePath(`/empresa/${claim.company.slug}`);
    return { status: "approved", companyName: claim.company.name };
  }

  // Sin dominio coincidente: queda pendiente de revision manual del admin.
  await prisma.companyClaim.update({
    where: { id: claim.id },
    data: { status: "PENDING", verifiedAt },
  });
  return { status: "pending", companyName: claim.company.name };
}

/**
 * Resolucion manual de una reclamacion por el admin (aprobar/rechazar).
 * El control de que el usuario sea ADMIN se hace en el layout de /admin.
 */
export async function resolveClaim(
  claimId: string,
  decision: "approve" | "reject",
  reason?: string,
): Promise<ClaimState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "No autorizado." };
  }

  const claim = await prisma.companyClaim.findUnique({
    where: { id: claimId },
    include: { company: { select: { id: true, name: true, slug: true, ownerId: true } } },
  });
  if (!claim) return { error: "Reclamacion no encontrada." };

  const now = new Date();

  if (decision === "approve") {
    if (claim.company.ownerId && claim.company.ownerId !== claim.userId) {
      return { error: "El perfil ya tiene otro propietario." };
    }
    await prisma.$transaction([
      prisma.companyClaim.update({
        where: { id: claim.id },
        data: { status: "APPROVED", resolvedAt: now },
      }),
      prisma.company.update({
        where: { id: claim.company.id },
        data: { ownerId: claim.userId, source: "CLAIMED", verified: true },
      }),
      prisma.user.update({
        where: { id: claim.userId },
        data: { role: "BUSINESS" },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "claim.approve",
          entity: "CompanyClaim",
          entityId: claim.id,
        },
      }),
    ]);
    const { subject, html } = claimApprovedEmail({
      companyName: claim.company.name,
      dashboardUrl: new URL("/dashboard", SITE.url).toString(),
    });
    await sendEmail({
      to: claim.claimantEmail,
      subject,
      html,
      template: "claim-approved",
    });
    revalidatePath(`/empresa/${claim.company.slug}`);
    revalidatePath("/admin/reclamaciones");
    return { success: true };
  }

  await prisma.$transaction([
    prisma.companyClaim.update({
      where: { id: claim.id },
      data: { status: "REJECTED", resolvedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "claim.reject",
        entity: "CompanyClaim",
        entityId: claim.id,
        metadata: reason ? { reason } : undefined,
      },
    }),
  ]);
  const { subject, html } = claimRejectedEmail({
    companyName: claim.company.name,
    reason,
  });
  await sendEmail({
    to: claim.claimantEmail,
    subject,
    html,
    template: "claim-rejected",
  });
  revalidatePath("/admin/reclamaciones");
  return { success: true };
}
