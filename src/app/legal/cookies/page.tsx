import type { Metadata } from "next";

import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL, SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: `Política de cookies — ${SITE.name}`,
  description: `Información sobre el uso de cookies en ${SITE.name} y cómo gestionarlas.`,
  path: "/legal/cookies",
});

export default function CookiesPage() {
  return (
    <LegalShell title="Política de cookies" updated="4 de junio de 2026">
      <p>
        Esta política describe qué son las cookies, cuáles utiliza {SITE.name} y
        cómo puedes gestionarlas, conforme al artículo 22.2 de la LSSI-CE y a las
        directrices de la Agencia Española de Protección de Datos.
      </p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Una cookie es un pequeño archivo que un sitio web almacena en tu
        navegador para recordar información sobre tu visita, como tus
        preferencias o datos de uso.
      </p>

      <h2>2. Cookies que utilizamos</h2>
      <ul>
        <li>
          <strong>Técnicas (necesarias):</strong> imprescindibles para el
          funcionamiento del sitio, como recordar el tema claro/oscuro o mantener
          la sesión. No requieren consentimiento.
        </li>
        <li>
          <strong>Analíticas:</strong> nos permiten medir de forma agregada y
          anónima cómo se usa el sitio para mejorarlo. Solo se activan con tu
          consentimiento.
        </li>
      </ul>
      <p>
        No utilizamos cookies publicitarias ni de perfilado con fines
        comerciales.
      </p>

      <h2>3. Cómo gestionar o desactivar las cookies</h2>
      <p>
        Puedes permitir, bloquear o eliminar las cookies desde la configuración
        de tu navegador. A continuación, los enlaces de ayuda de los principales
        navegadores:
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647">
            Google Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan">
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac">
            Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/es-es/microsoft-edge">
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>
        Ten en cuenta que desactivar ciertas cookies puede afectar al
        funcionamiento de algunas partes del sitio.
      </p>

      <h2>4. Cambios y contacto</h2>
      <p>
        Podemos actualizar esta política para adaptarla a cambios normativos o
        técnicos. Para cualquier duda, escríbenos a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalShell>
  );
}
