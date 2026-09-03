export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
// sharp is imported lazily inside the handler, NOT at the top of the module.
// A static top-level import fails at MODULE LOAD time when the native binary
// is missing, which killed the whole route with a 500 before GET ever ran --
// so the try/catch below, which exists precisely to fall back to the original
// image, never got a chance. ~1,858 errors in four days and every
// representative photo on the site broken, including on /pro.
// Loading it lazily lets the fallback do its job: webp when sharp works,
// the untouched original when it does not.

const BIOGUIDE_RE = /^[A-Z]\d{6}$/

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CivicWatch/1.0; +https://civicwatch.app)',
  'Accept': 'image/jpeg,image/*,*/*',
}

// Ordered by reliability, not preference. bioguide.congress.gov and
// www.congress.gov sit behind Cloudflare bot protection that terminates
// server-to-server fetches from datacenter IPs — including Vercel's — while
// working fine from a browser. That's a known, unresolved issue on the
// Library of Congress's side (see
// https://github.com/LibraryOfCongress/api.congress.gov/issues/310), and it
// was silently 404-ing every rep photo on the site. The unitedstates/images
// mirror (community-maintained, synced from GPO via GitHub Actions, served
// through jsDelivr) isn't behind that protection, so it's the primary
// source now. The congress.gov URLs stay as a last-resort fallback in case
// the mirror ever lags behind for a very recently sworn-in member.
function sourcesFor(bioguideId) {
  return [
    `https://cdn.jsdelivr.net/gh/unitedstates/images@gh-pages/congress/225x275/${bioguideId}.jpg`,
    `https://bioguide.congress.gov/bioguide/photo/${bioguideId[0]}/${bioguideId}.jpg`,
    `https://www.congress.gov/img/member/${bioguideId.toLowerCase()}_200.jpg`,
  ]
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: FETCH_HEADERS })
    return res.ok ? res : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(request, { params }) {
  const rawId = (await params).bioguideId
  const bioguideId = rawId?.trim().toUpperCase()

  if (!bioguideId || !BIOGUIDE_RE.test(bioguideId)) {
    return NextResponse.json({ error: 'Invalid bioguide ID' }, { status: 400 })
  }

  let res = null
  for (const url of sourcesFor(bioguideId)) {
    res = await fetchWithTimeout(url, 3000)
    if (res) break
  }

  if (!res) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const buffer = await res.arrayBuffer()

  try {
    const sharp = (await import('sharp')).default
    const webpBuffer = await sharp(Buffer.from(buffer))
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer()
    return new Response(webpBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    // Degraded but working: serve the original image unresized. Logged so a
    // silently-degraded route is visible rather than looking healthy.
    console.warn('[rep-photo] sharp unavailable, serving original:', err?.message)
    return new Response(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  }
}
