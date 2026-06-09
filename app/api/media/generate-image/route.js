import { auth } from '@clerk/nextjs/server'
import { generateImage } from '@/lib/airbrush'

export async function POST(request) {
  const internalSecret = request.headers.get('x-internal-secret')
  const isInternalCall = internalSecret && internalSecret === process.env.INTERNAL_API_SECRET

  if (!isInternalCall) {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { prompt, engine, dimensions, negative_prompt } = body

  if (!prompt) {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  try {
    const imageUrl = await generateImage(prompt, {
      engine,
      dimensions,
      negativePrompt: negative_prompt,
    })
    return Response.json({ imageUrl, creditsRemaining: null })
  } catch (err) {
    console.error('[media/generate-image] generation failed:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
