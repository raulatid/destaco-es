import type { Metadata } from "next";

import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL, SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: `Términos y condiciones — ${SITE.name}`,
  description: `Términos y condiciones de uso del directorio ${SITE.name}.`,
  path: "/legal/terminos",
});

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y condiciones" updated="4 de junio de 2026">
      <h2>1. Aceptación</h2>
      <p>
        El uso de {SITE.name} implica la aceptación de estos términos. Si no
        estás de acuerdo con ellos, te rogamos que no utilices el sitio.
      </p>

      <h2>2. Servicio</h2>
      <p>
        {SITE.name} ofrece un directorio gratuito de empresas. Facilitamos
        información de contacto y valoraciones, pero no intervenimos en la
        relación entre usuarios y empresas ni cobramos comisiones por los
        contactos generados.
      </p>

      <h2>3. Fichas de empresa</h2>
      <ul>
        <li>
          La información procede de fuentes públicas y de los titulares de cada
          empresa, y puede contener imprecisiones.
        </li>
        <li>
          El titular de una empresa puede reclamar su ficha de forma gratuita
          para gestionar y corregir su información.
        </li>
        <li>
          Para solicitar la modificación o eliminación de una ficha, escribe a{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </li>
      </ul>

      <h2>4. Obligaciones del usuario</h2>
      <p>
        El usuario se compromete a no realizar un uso fraudulento del sitio, a no
        introducir contenido ilícito o falso y a respetar los derechos de
        terceros y la legislación vigente.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        {SITE.name} no se responsabiliza de los servicios prestados por las
        empresas listadas ni de la exactitud de los datos aportados por terceros.
        El sitio se ofrece «tal cual», sin garantías de disponibilidad
        ininterrumpida.
      </p>

      <h2>6. Modificaciones y ley aplicable</h2>
      <p>
        Podemos modificar estos términos en cualquier momento. Las relaciones
        derivadas del uso del sitio se rigen por la legislación española. Titular:{" "}
        {LEGAL.ownerName} (NIF {LEGAL.nif}).
      </p>
    </LegalShell>
  );
}
