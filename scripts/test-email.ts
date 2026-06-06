/**
 * Envia un correo de prueba a traves de Resend para confirmar que el dominio
 * verificado y la RESEND_API_KEY funcionan de extremo a extremo. Registra el
 * envio en EmailLog igual que el flujo real.
 *
 *   npx tsx scripts/test-email.ts tu-correo@ejemplo.com
 *   TEST_EMAIL=tu-correo@ejemplo.com npx tsx scripts/test-email.ts
 *
 * Requiere RESEND_API_KEY en .env (y el dominio verificado en Resend).
 */
export {};

try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env */
}

async function main() {
  const to = process.argv[2] || process.env.TEST_EMAIL;
  if (!to) {
    console.error(
      "Falta el destinatario.\n  Uso: npx tsx scripts/test-email.ts tu-correo@ejemplo.com",
    );
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error(
      "RESEND_API_KEY no esta configurada en .env — no se puede enviar.",
    );
    process.exit(1);
  }

  const { sendEmail } = await import("../src/lib/email/resend");

  const now = new Date().toLocaleString("es-ES");
  console.log(`Enviando correo de prueba a ${to} ...`);

  const result = await sendEmail({
    to,
    subject: "Prueba de envio · Destaco.es",
    template: "test",
    html: `
      <div style="font-family: system-ui, sans-serif; line-height: 1.6; color: #18181b;">
        <h2 style="margin: 0 0 12px;">Resend funciona correctamente</h2>
        <p>Este es un correo de prueba enviado desde <strong>Destaco.es</strong>.</p>
        <p>Si lo recibes, el dominio esta verificado y los emails transaccionales
        (verificacion de reclamaciones, avisos) ya se entregaran sin problemas.</p>
        <p style="color: #71717a; font-size: 13px;">Generado el ${now}.</p>
      </div>
    `,
  });

  if (result.ok) {
    console.log(`OK — correo enviado. ID de Resend: ${result.id}`);
    process.exit(0);
  } else {
    console.error(`FALLO — ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
