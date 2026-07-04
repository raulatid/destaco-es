/**
 * Plantillas HTML de correo (inline styles para compatibilidad con clientes).
 * Estetica monocroma + acento indigo, coherente con el sitio.
 */
import { SITE } from "@/lib/constants";

const ACCENT = "#4f46e5";

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title></head>
<body style="margin:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#171717;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px;">Destaco<span style="color:${ACCENT}">.es</span></div>
    <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px;">
      ${bodyHtml}
    </div>
    <p style="font-size:12px;color:#737373;margin-top:24px;text-align:center;">
      ${SITE.name} — el directorio empresarial mas moderno de Espana.<br>
      Si no esperabas este correo, puedes ignorarlo.
    </p>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;font-size:15px;">${label}</a>`;
}

export interface ClaimVerificationInput {
  companyName: string;
  verifyUrl: string;
  expiresHours: number;
}

export function claimVerificationEmail(input: ClaimVerificationInput) {
  const subject = `Verifica tu reclamacion de ${input.companyName} en Destaco`;
  const html = layout(
    subject,
    `<h1 style="font-size:18px;margin:0 0 12px;">Confirma que gestionas ${input.companyName}</h1>
     <p style="font-size:15px;line-height:1.55;color:#404040;margin:0 0 20px;">
       Has solicitado reclamar el perfil de <strong>${input.companyName}</strong>.
       Pulsa el boton para verificar tu correo y completar la reclamacion.
       El enlace caduca en ${input.expiresHours} horas.
     </p>
     <p style="margin:0 0 24px;">${button(input.verifyUrl, "Verificar y reclamar perfil")}</p>
     <p style="font-size:13px;color:#737373;margin:0;word-break:break-all;">
       Si el boton no funciona, copia y pega esta URL en tu navegador:<br>${input.verifyUrl}
     </p>`,
  );
  return { subject, html };
}

export interface ClaimResolvedInput {
  companyName: string;
  dashboardUrl?: string;
  reason?: string;
}

export function claimApprovedEmail(input: ClaimResolvedInput) {
  const subject = `Reclamacion aprobada: ya gestionas ${input.companyName}`;
  const html = layout(
    subject,
    `<h1 style="font-size:18px;margin:0 0 12px;">Reclamacion aprobada</h1>
     <p style="font-size:15px;line-height:1.55;color:#404040;margin:0 0 20px;">
       Hemos verificado tu reclamacion de <strong>${input.companyName}</strong>.
       Ya puedes editar el perfil, subir proyectos, responder reseñas y ver tus metricas.
     </p>
     ${
       input.dashboardUrl
         ? `<p style="margin:0;">${button(input.dashboardUrl, "Ir a mi panel")}</p>`
         : ""
     }`,
  );
  return { subject, html };
}

export function claimRejectedEmail(input: ClaimResolvedInput) {
  const subject = `Tu reclamacion de ${input.companyName} no se ha aprobado`;
  const html = layout(
    subject,
    `<h1 style="font-size:18px;margin:0 0 12px;">Reclamacion no aprobada</h1>
     <p style="font-size:15px;line-height:1.55;color:#404040;margin:0 0 12px;">
       No hemos podido verificar tu reclamacion de <strong>${input.companyName}</strong>.
     </p>
     ${
       input.reason
         ? `<p style="font-size:14px;color:#737373;margin:0 0 12px;">Motivo: ${input.reason}</p>`
         : ""
     }
     <p style="font-size:14px;color:#737373;margin:0;">
       Puedes volver a intentarlo desde un correo corporativo del dominio de la empresa
       o contactar con nuestro equipo.
     </p>`,
  );
  return { subject, html };
}

// ---- Email de conversion al plan Destacado (cron) ---------------------------

export interface DestacarPitchInput {
  firstName?: string | null;
  companyName: string;
  categoryNoun?: string | null; // "abogados", "agencias de marketing"...
  cityName?: string | null;
  /** Empresas de la misma categoria+ciudad (competencia en su listado). */
  competitors: number;
  /** Nº de toque (1-3): cambia el asunto para no repetirse. */
  touch: number;
  destacarUrl: string;
  optOutUrl: string;
}

/**
 * Pitch de venta del plan Destacado para duenos de fichas publicadas sin plan.
 * Sin informe de metricas: gancho directo ("hasta x10 mas clientes"), maximo
 * 3 toques por usuario con asuntos distintos.
 */
export function destacarPitchEmail(input: DestacarPitchInput) {
  const subjects = [
    `¿Sabias que ${input.companyName} podria llegar hasta ×10 mas clientes?`,
    input.firstName
      ? `${input.firstName}, ¿cuantos clientes estan viendo antes a tu competencia?`
      : `¿Cuantos clientes estan viendo antes a tu competencia?`,
    `Ultimo aviso: el 50% de descuento para destacar ${input.companyName}`,
  ];
  const subject =
    subjects[Math.min(Math.max(input.touch, 1), subjects.length) - 1];

  const where =
    input.categoryNoun && input.cityName
      ? `buscando <strong>${input.categoryNoun} en ${input.cityName}</strong>`
      : `buscando negocios como el tuyo`;
  const crowd =
    input.competitors > 1
      ? ` Y tu ficha esta ahi… mezclada entre <strong>${input.competitors} empresas</strong> que compiten por ese mismo cliente.`
      : ` Y que te encuentren rapido marca la diferencia.`;

  const html = layout(
    subject,
    `<h1 style="font-size:19px;margin:0 0 12px;">${input.firstName ? `Hola, ${input.firstName}. ` : ""}Hay clientes ${where} ahora mismo</h1>
     <p style="font-size:15px;line-height:1.6;color:#404040;margin:0 0 16px;">
       Cada dia entra gente en Destaco.es ${where}.${crowd}
     </p>
     <p style="font-size:15px;line-height:1.6;color:#404040;margin:0 0 14px;">
       Con el plan <strong>Destacado</strong>, <strong>${input.companyName}</strong> pasa a
       aparecer <strong>la primera</strong>, con su insignia dorada:
     </p>
     <table style="border-collapse:collapse;margin:0 0 18px;">
       <tr><td style="padding:4px 8px 4px 0;color:${ACCENT};font-weight:700;">★</td>
           <td style="padding:4px 0;font-size:14.5px;color:#404040;">Siempre <strong>por encima de tu competencia</strong> en tu categoria y ciudad</td></tr>
       <tr><td style="padding:4px 8px 4px 0;color:${ACCENT};font-weight:700;">★</td>
           <td style="padding:4px 0;font-size:14.5px;color:#404040;">Hasta <strong>×10 mas visibilidad</strong> que una ficha normal: mas visitas, mas llamadas</td></tr>
       <tr><td style="padding:4px 8px 4px 0;color:${ACCENT};font-weight:700;">★</td>
           <td style="padding:4px 0;font-size:14.5px;color:#404040;">Insignia «Destacada» que transmite confianza y dispara los clics</td></tr>
     </table>
     <p style="margin:0 0 10px;">${button(input.destacarUrl, "Quiero aparecer el primero")}</p>
     <p style="font-size:14px;color:#525252;margin:0 0 4px;">
       <strong>Oferta de lanzamiento: 50% de descuento.</strong> Desde 49,99 &euro;/a&ntilde;o + IVA
       (sale a poco mas de 4 &euro;/mes). Sin permanencia: lo cancelas cuando quieras.
     </p>
     <p style="font-size:13px;color:#737373;margin:12px 0 0;">
       P. D. Tu ficha gratuita seguira siendo gratis siempre. Esto es solo para
       cuando quieras acelerar.
     </p>
     <p style="font-size:12px;color:#a3a3a3;margin:16px 0 0;">
       Recibes este correo porque tienes una empresa publicada en Destaco.es.
       <a href="${input.optOutUrl}" style="color:#737373;">No quiero recibir estos correos</a>.
     </p>`,
  );
  return { subject, html };
}
