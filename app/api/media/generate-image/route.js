export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { generateImage } from '@/lib/airbrush'
import { validateAIRequest, checkSpendCap, logTokenUsage } from '@/lib/ai-gateway'

export async function POST(request) {
  const internalSecret = request.headers.get('x-internal-secret')
  const isInternalCall = internalSecret && internalSecret === process.env.INTERNAL_API_SECRET

  let userId = null
  if (!isInternalCall) {
    const authResult = await auth()
    userId = authResult.userId
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

  // ── Payload validation ────────────────────────────────────────────────────
  const validationError = validateAIRequest(request, body, {
    requiredFields: ['prompt'],
    contextField: 'prompt',
  })
  if (validationError) return validationError

  // ── Spend cap (external calls only) ──────────────────────────────────────
  if (!isInternalCall) {
    const underCap = await checkSpendCap(userId, 'free')
    if (!underCap) {
      return Response.json(
        { error: 'Daily token limit reached. Resets at midnight UTC.' },
        { status: 429, headers: { 'Retry-After': '86400' } }
      )
    }
  }

  const { prompt, engine, dimensions, negative_prompt } = body

  try {
    const imageUrl = await generateImage(prompt, {
      engine,
      dimensions,
      negativePrompt: negative_prompt,
    })

    // Airbrush is credit-based, not token-based — log 0/0 for record-keeping
    if (userId) {
      await logTokenUsage(userId, 'media/generate-image', `airbrush/${engine ?? 'flux'}`, 0, 0)
    }

    return Response.json({ imageUrl, creditsRemaining: null })
  } catch (err) {
    console.error('[media/generate-image] generation failed:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
