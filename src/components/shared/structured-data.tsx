type StructuredDataProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

// Escape "<" so content such as a title containing "</script>" cannot close
// the tag early and inject markup (see Next.js JSON-LD guide).
export function serializeJsonLd(data: StructuredDataProps["data"]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
