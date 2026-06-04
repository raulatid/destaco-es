import type { Metadata } from "next";

import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL, SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: `Política de privacidad y protección de datos — ${SITE.name}`,
  description: `Cómo ${SITE.name} trata y protege tus datos personales conforme al RGPD y la LOPDGDD.`,
  path: "/legal/privacidad",
});

export default function PrivacidadPage() {
  return (
    <LegalShell
      title="Política de privacidad y protección de datos"
      updated="4 de junio de 2026"
    >
      <p>
        Esta política explica cómo {SITE.name} trata los datos personales de
        acuerdo con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018,
        de Protección de Datos Personales y garantía de los derechos digitales
        (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>
          <strong>Titular:</strong> {LEGAL.ownerName}
        </li>
        <li>
          <strong>NIF:</strong> {LEGAL.nif}
        </li>
        <li>
          <strong>Domicilio:</strong> {LEGAL.address}
        </li>
        <li>
          <strong>Contacto:</strong>{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </li>
      </ul>

      <h2>2. Datos que tratamos</h2>
      <ul>
        <li>
          <strong>Datos de contacto</strong> que facilitas al registrarte,
          reclamar una ficha o escribirnos (nombre, correo electrónico,
          teléfono).
        </li>
        <li>
          <strong>Datos de empresas</strong> publicados en el directorio,
          obtenidos de fuentes públicas o aportados por sus titulares.
        </li>
        <li>
          <strong>Datos de navegación</strong> (dirección IP de forma anonimizada
          y datos analíticos agregados) para medir el uso del sitio.
        </li>
      </ul>

      <h2>3. Finalidad y base jurídica</h2>
      <ul>
        <li>
          Prestar el servicio del directorio y gestionar las fichas —{" "}
          <strong>ejecución de un contrato</strong> o <strong>interés legítimo</strong>.
        </li>
        <li>
          Responder a tus consultas y gestionar reclamaciones de perfil —{" "}
          <strong>consentimiento</strong> e interés legítimo.
        </li>
        <li>
          Enviar comunicaciones si te suscribes — <strong>consentimiento</strong>,
          revocable en cualquier momento.
        </li>
      </ul>

      <h2>4. Conservación</h2>
      <p>
        Conservamos los datos mientras exista relación con el usuario o sean
        necesarios para las finalidades descritas, y posteriormente durante los
        plazos legalmente exigidos. Cuando dejan de ser necesarios, se suprimen.
      </p>

      <h2>5. Destinatarios</h2>
      <p>
        No cedemos datos a terceros salvo obligación legal. Algunos proveedores
        tecnológicos (alojamiento, analítica) pueden tratar datos como
        encargados, bajo contrato y con garantías adecuadas.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de <strong>acceso, rectificación, supresión,
        oposición, limitación y portabilidad</strong>, así como retirar el
        consentimiento, escribiendo a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>, indicando el derecho
        que deseas ejercer. También puedes reclamar ante la Agencia Española de
        Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).
      </p>

      <h2>7. Empresas listadas</h2>
      <p>
        Si eres titular de una empresa publicada y deseas modificar o eliminar su
        información, solicítalo a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> y atenderemos la
        petición a la mayor brevedad.
      </p>
    </LegalShell>
  );
}
