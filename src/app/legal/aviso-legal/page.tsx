import type { Metadata } from "next";

import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL, SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: `Aviso legal — ${SITE.name}`,
  description: `Aviso legal y condiciones generales de uso de ${SITE.name}.`,
  path: "/legal/aviso-legal",
});

export default function AvisoLegalPage() {
  return (
    <LegalShell title="Aviso legal" updated="4 de junio de 2026">
      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de
        Servicios de la Sociedad de la Información y de Comercio Electrónico
        (LSSI-CE), se informa de que el titular de este sitio web es:
      </p>
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
          <strong>Correo electrónico:</strong>{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </li>
        <li>
          <strong>Sitio web:</strong> {SITE.url}
        </li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        {SITE.name} es un directorio de empresas que permite a los usuarios
        descubrir, comparar y contactar con negocios de España, organizados por
        categoría, provincia y ciudad. La información de las fichas procede de
        fuentes públicas y de los propios titulares de las empresas.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El acceso y uso de este sitio atribuye la condición de usuario e implica
        la aceptación de las presentes condiciones. El usuario se compromete a
        utilizar el sitio de conformidad con la ley, la buena fe y el orden
        público, absteniéndose de utilizar los contenidos con fines ilícitos o
        lesivos para terceros.
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Los contenidos del sitio (textos, diseño, logotipos y estructura) son
        titularidad del responsable o se utilizan con autorización. Queda
        prohibida su reproducción, distribución o transformación sin
        autorización expresa. Las marcas, nombres comerciales y logotipos de las
        empresas listadas pertenecen a sus respectivos titulares.
      </p>

      <h2>5. Exención de responsabilidad</h2>
      <p>
        {SITE.name} no garantiza la disponibilidad continua del sitio ni la
        exactitud completa de los datos de cada ficha, al provenir parcialmente
        de fuentes de terceros. Si detectas información incorrecta sobre tu
        empresa, puedes solicitar su corrección o eliminación escribiendo a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>6. Legislación aplicable</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para la
        resolución de cualquier controversia, las partes se someten a los
        juzgados y tribunales que correspondan conforme a derecho.
      </p>
    </LegalShell>
  );
}
