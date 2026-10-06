// Renders one or more schema.org JSON-LD blocks. No hooks or browser APIs, so
// it works from both server and client pages and ships in the SSR HTML.
// "<" is escaped so data can never close the script tag.
export default function JsonLd({ data }) {
  const blocks = Array.isArray(data) ? data : [data]
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  )
}
