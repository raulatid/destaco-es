/**
 * Inyecta un bloque JSON-LD (datos estructurados schema.org).
 * Uso: <JsonLd data={localBusinessJsonLd(company)} />
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
