export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

const BIOGUIDE_RE = /^[A-Z]\d{6}$/

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CivicWatch/1.0; +https://civicwatch.app)',
  'Accept': 'image/jpeg,image/*,*/*',
}

export async function GET(request, { params }) {
  const rawId = (await params).bioguideId
  const bioguideId = rawId?.trim().toUpperCase()

  if (!bioguideId || !BIOGUIDE_RE.test(bioguideId)) {
    return NextResponse.json({ error: 'Invalid bioguide ID' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const bioguideUrl = `https://bioguide.congress.gov/bioguide/photo/${bioguideId[0]}/${bioguideId}.jpg`
    let res = await fetch(bioguideUrl, { signal: controller.signal, headers: FETCH_HEADERS })

    if (!res.ok) {
      const fallbackUrl = `https://www.congress.gov/img/member/${bioguideId.toLowerCase()}_200.jpg`
      res = await fetch(fallbackUrl, { signal: controller.signal, headers: FETCH_HEADERS })
    }

    if (!res.ok) {
      clearTimeout(timeout)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    clearTimeout(timeout)
    const buffer = await res.arrayBuffer()
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 404 })
  }
}
