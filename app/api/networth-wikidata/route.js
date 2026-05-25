import { NextResponse } from 'next/server';

const UA = 'CivicWatch/1.0 (civicwatch.app)';
const WD_SPARQL = 'https://query.wikidata.org/sparql';
const WD_API = 'https://www.wikidata.org/w/api.php';
const WP_API = 'https://en.wikipedia.org/w/api.php';

async function apiFetch(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal });
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Attempt 1: Wikidata P2218 (net worth property) via SPARQL
async function fetchP2218(name) {
  const safe = name.toLowerCase().replace(/"/g, '').replace(/\\/g, '');
  const sparql = `
    SELECT ?person ?personLabel ?netWorth ?pointInTime WHERE {
      ?person rdfs:label "${safe}"@en .
      ?person wdt:P31 wd:Q5 .
      ?person p:P2218 ?nwStatement .
      ?nwStatement ps:P2218 ?netWorth .
      OPTIONAL { ?nwStatement pq:P585 ?pointInTime }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    ORDER BY DESC(?pointInTime)
    LIMIT 5
  `;
  const data = await apiFetch(`${WD_SPARQL}?query=${encodeURIComponent(sparql)}&format=json`);
  return data?.results?.bindings || [];
}

// Attempt 2a: Wikidata entity search to get QID
async function findEntityQID(name) {
  const url = `${WD_API}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&format=json&limit=10`;
  const data = await apiFetch(url);
  const results = data.search || [];
  const political = results.find(e => {
    const desc = (e.description || '').toLowerCase();
    return desc.includes('politician') || desc.includes('senator') ||
           desc.includes('representative') || desc.includes('congressman') ||
           desc.includes('congresswoman') || desc.includes('american politician');
  });
  return (political || results[0])?.id;
}

// Attempt 2b: Get net worth from Wikipedia plain-text extract for a Wikidata QID.
// Uses targeted APIs to avoid fetching multi-MB entity/article blobs.
async function getNetWorthFromWikipedia(qid) {
  // Fetch only the enwiki sitelink (tiny response vs full Special:EntityData)
  const sitelinkData = await apiFetch(
    `${WD_API}?action=wbgetentities&ids=${qid}&props=sitelinks&sitefilter=enwiki&format=json`,
  );
  const title = sitelinkData.entities?.[qid]?.sitelinks?.enwiki?.title;
  if (!title) return null;

  // Fetch plain-text article extract — much smaller than full wikitext, no ref noise
  const extractData = await apiFetch(
    `${WP_API}?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=1&exsectionformat=plain&format=json&formatversion=2`,
    15000,
  );
  const content = extractData.query?.pages?.[0]?.extract;
  if (!content) return null;

  return parseNetWorth(content);
}

// Parse dollar net-worth amounts from plain text.
// Requires the dollar amount to FOLLOW "net worth" within 100 chars (filters out income figures).
function parseNetWorth(text) {
  const rx = /net.?worth[^$]{0,100}\$\s*([\d,]+(?:\.\d+)?)\s*(million|billion|trillion)/gi;
  const MULT = { million: 1e6, billion: 1e9, trillion: 1e12 };
  const candidates = [];
  let m;
  while ((m = rx.exec(text)) !== null) {
    const num = parseFloat(m[1].replace(/,/g, ''));
    const mult = MULT[m[2].toLowerCase()];
    if (!isNaN(num) && num > 0 && mult) candidates.push(num * mult);
  }

  // Return the last mention — typically the most recent estimate
  return candidates.length ? candidates[candidates.length - 1] : null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) return NextResponse.json({ netWorth: null });

  try {
    // Attempt 1: Wikidata P2218 (exists for some non-US politicians)
    const bindings = await fetchP2218(name).catch(() => []);
    if (bindings.length) {
      const top = bindings[0];
      const amount = parseFloat(top.netWorth?.value);
      const year = top.pointInTime?.value ? new Date(top.pointInTime.value).getFullYear() : null;
      if (!isNaN(amount)) {
        return NextResponse.json({ netWorth: amount, year, label: top.personLabel?.value, source: 'wikidata-p2218' });
      }
    }

    // Attempt 2: Wikipedia article text parsing
    const qid = await findEntityQID(name).catch(() => null);
    if (qid) {
      const netWorth = await getNetWorthFromWikipedia(qid).catch(() => null);
      if (netWorth) {
        return NextResponse.json({ netWorth, source: 'wikipedia', qid });
      }
    }

    return NextResponse.json({ netWorth: null, source: 'wikidata' });
  } catch (e) {
    return NextResponse.json({ netWorth: null, source: 'wikidata', error: e.message });
  }
}
