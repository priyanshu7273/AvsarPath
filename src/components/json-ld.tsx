/**
 * Renders a schema.org JSON-LD block. The payload is escaped so a stray "<"
 * (e.g. inside a title) can't break out of the <script> element.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // JSON-LD is data, not executable markup; the value above is escaped.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
