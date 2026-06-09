export const dynamic = 'force-dynamic'

import { generateImage } from '@/lib/airbrush'

const FALLBACK = 'https://civicwatch.app/og-image.png'
const cache = new Map()

function buildPrompt(type, name, party, state) {
  const partyNames = { D: 'Democratic', R: 'Republican', I: 'Independent' }
  const partyFull = partyNames[party] || party || ''

  if (type === 'member') {
    return `Professional political portrait concept for ${name}, ${partyFull} senator/representative from ${state}. Capitol building background, American flag, navy and gold color palette, civic accountability theme, editorial photography style. No text.`
  }
  if (type === 'bill') {
    return `Congressional legislation visual concept for '${name}'. U.S. Capitol dome, official documents, American flag, navy blue and gold palette, transparency and accountability theme. No text.`
  }
  return 'U.S. Capitol building at dusk, dramatic lighting, navy blue sky, gold accents, transparency and civic accountability theme, editorial photography style. No text.'
}

function cacheKey(params) {
  return JSON.stringify(params)
}

export async function GET(request) {
  if (!process.env.NEXT_PUBLIC_OG_IMAGE_ENABLED) {
    return Response.redirect(FALLBACK, 302)
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'home'
  const name = searchParams.get('name') || ''
  const party = searchParams.get('party') || ''
  const state = searchParams.get('state') || ''

  const key = cacheKey({ type, name, party, state })
  if (cache.has(key)) {
    return Response.redirect(cache.get(key), 302)
  }

  try {
    const prompt = buildPrompt(type, name, party, state)
    const imageUrl = await generateImage(prompt, {
      engine: 'flux',
      dimensions: 'landscape',
      negativePrompt: 'text, letters, words, watermark, logo, ugly, distorted, low quality',
    })
    cache.set(key, imageUrl)
    return Response.redirect(imageUrl, 302)
  } catch (err) {
    console.error('[og-image] generation failed:', err)
    return Response.redirect(FALLBACK, 302)
  }
}
