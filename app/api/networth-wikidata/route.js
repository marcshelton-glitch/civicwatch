import { NextResponse } from 'next/server';

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) return NextResponse.json({ netWorth: null });

  const sparql = `
    SELECT ?person ?personLabel ?netWorth ?pointInTime WHERE {
      ?person rdfs:label ?personLabel .
      FILTER(LANG(?personLabel) = "en")
      FILTER(CONTAINS(LCASE(?personLabel), "${name.toLowerCase()}"))
      ?person p:P39 ?posStatement .
      ?posStatement ps:P39 ?position .
      VALUES ?position { wd:Q13218630 wd:Q13216942 wd:Q4416090 wd:Q18946745 }
      ?person p:P2218 ?nwStatement .
      ?nwStatement ps:P2218 ?netWorth .
      OPTIONAL { ?nwStatement pq:P585 ?pointInTime }
    }
    ORDER BY DESC(?pointInTime)
    LIMIT 5
  `;

  try {
    const res = await fetch(
      `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(sparql)}&format=json`,
      { headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } }
    );
    const data = await res.json();
    const bindings = data?.results?.bindings;
    if (!bindings?.length) return NextResponse.json({ netWorth: null, source: 'wikidata' });

    const top = bindings[0];
    const amount = parseFloat(top.netWorth?.value);
    const year = top.pointInTime?.value ? new Date(top.pointInTime.value).getFullYear() : null;

    return NextResponse.json({
      netWorth: isNaN(amount) ? null : amount,
      year,
      label: top.personLabel?.value,
      source: 'wikidata',
    });
  } catch (e) {
    return NextResponse.json({ netWorth: null, source: 'wikidata', error: e.message });
  }
}
