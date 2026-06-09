const AIRBRUSH_API_URL = 'https://app.airbrush.ai/create-art-api'

export async function generateImage(prompt, options = {}) {
  const apiKey = process.env.AIRBRUSH_API_KEY
  if (!apiKey) throw new Error('AIRBRUSH_API_KEY is not set')

  const body = {
    api_key: apiKey,
    content: prompt,
    ai_engine: options.engine ?? 'flux',
    image_dimensions: options.dimensions ?? 'landscape',
    ...(options.seed != null && { seed: options.seed }),
    ...(options.guidance != null && { guidance: options.guidance }),
    ...(options.negativePrompt && { negative_prompt: options.negativePrompt }),
  }

  const res = await fetch(AIRBRUSH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Airbrush API error ${res.status}: ${text}`)
  }

  const json = await res.json()

  if (!json.success) {
    throw new Error(`Airbrush generation failed: ${JSON.stringify(json)}`)
  }

  const { image_url, credits_remaining } = json.data
  console.log(`[airbrush] credits_remaining=${credits_remaining}`)

  return image_url
}
