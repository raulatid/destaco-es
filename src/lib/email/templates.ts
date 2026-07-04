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

// ---- Informe periodico de visitas (cron) -----------------------------------

export interface StatsReportInput {
  firstName?: string | null;
  companyName: string;
  /** true si el usuario tiene mas de una empresa publicada. */
  hasMore: boolean;
  views: number;
  impressions: number;
  clicks: number;
  destacarUrl: string;
  optOutUrl: string;
}

const num = (n: number) => new Intl.NumberFormat("es-ES").format(n);

function statRow(label: string, value: number): string {
  return `<tr>
    <td style="padding:10px 0;font-size:14px;color:#404040;border-bottom:1px solid #f0f0f0;">${label}</td>
    <td style="padding:10px 0;font-size:16px;font-weight:700;text-align:right;border-bottom:1px solid #f0f0f0;">${num(value)}</td>
  </tr>`;
}

/**
 * Informe de visibilidad para duenos de empresas publicadas SIN plan Destacado.
 * Muestra sus metricas REALES y anima a destacar para multiplicar visibilidad.
 */
export function statsReportEmail(input: StatsReportInput) {
  const who = input.hasMore
    ? `${input.companyName} y el resto de tus empresas`
    : input.companyName;
  const subject = `${input.companyName} en Destaco: ${num(input.impressions)} apariciones y ${num(input.views)} visitas`;
  const html = layout(
    subject,
    `<h1 style="font-size:18px;margin:0 0 12px;">${input.firstName ? `Hola, ${input.firstName}. ` : ""}Asi va tu empresa en Destaco</h1>
     <p style="font-size:15px;line-height:1.55;color:#404040;margin:0 0 16px;">
       Resumen de lo que ha conseguido <strong>${who}</strong> hasta hoy:
     </p>
     <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
       ${statRow("Apariciones en listados y busquedas", input.impressions)}
       ${statRow("Visitas a tu ficha", input.views)}
       ${statRow("Contactos (telefono, email y web)", input.clicks)}
     </table>
     <p style="font-size:15px;line-height:1.55;color:#404040;margin:0 0 8px;">
       <strong>¿Quieres multiplicar estos numeros?</strong> Las empresas con el plan
       Destacado aparecen <strong>siempre en las primeras posiciones</strong> de su
       categoria y ciudad, por delante de su competencia: eso supone hasta
       <strong>&times;10 de visibilidad</strong> respecto a una ficha normal.
     </p>
     <p style="font-size:14px;color:#737373;margin:0 0 20px;">
       Oferta de lanzamiento: 50% de descuento, desde 49,99 &euro;/a&ntilde;o + IVA. Sin permanencia.
     </p>
     <p style="margin:0 0 8px;">${button(input.destacarUrl, "Destacar mi empresa")}</p>
     <p style="font-size:12px;color:#a3a3a3;margin:16px 0 0;">
       Recibes este informe porque tienes una empresa publicada en Destaco.es.
       <a href="${input.optOutUrl}" style="color:#737373;">No quiero recibir estos informes</a>.
     </p>`,
  );
  return { subject, html };
}
