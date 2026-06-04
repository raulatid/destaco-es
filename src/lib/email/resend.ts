/**
 * Servicio de email transaccional sobre Resend.
 *
 * Toda salida de correo pasa por `sendEmail`, que registra un `EmailLog`
 * (QUEUED -> SENT/FAILED). Si `RESEND_API_KEY` no esta configurada, el envio
 * se marca como FAILED con un mensaje claro y NO lanza: el flujo de negocio
 * (p. ej. crear una reclamacion) no debe romperse por un fallo de correo.
 */
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const FROM = process.env.RESEND_FROM ?? "Destaco.es <hola@destaco.es>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  template: string; // identifica la plantilla para trazabilidad
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const log = await prisma.emailLog.create({
    data: {
      to: input.to,
      subject: input.subject,
      template: input.template,
      status: "QUEUED",
      metadata: input.metadata
        ? (JSON.parse(JSON.stringify(input.metadata)) as object)
        : undefined,
    },
  });

  const resend = getClient();
  if (!resend) {
    const error = "RESEND_API_KEY no configurada — correo no enviado.";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error },
    });
    console.warn(`[email] ${error} (to: ${input.to})`);
    return { ok: false, error };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) throw new Error(error.message);

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", providerId: data?.id ?? null },
    });
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error: message },
    });
    console.error(`[email] envio fallido (to: ${input.to}):`, message);
    return { ok: false, error: message };
  }
}
