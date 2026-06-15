import { createClient } from '@supabase/supabase-js'

/*
 * GATEWAY RECOMMENDATION
 * ────────────────────────────────────────────────────────────────────────
 * Stack: Vercel (edge) + Supabase + Cloudflare (CDN/DNS)
 *
 * proxy.ts already IS the gateway layer — it runs at the Vercel edge before
 * any route handler, enforcing auth and routing rules. Adding Kong or AWS
 * API Gateway would duplicate this with unnecessary infra overhead (extra
 * hop, extra cost, more operational surface area).
 *
 * For CDN-layer protection: Cloudflare API Shield is Enterprise-only.
 * Use Cloudflare WAF custom rules (free/pro tier) instead:
 *   - Payload size: block requests where http.request.body.size > 51200
 *   - Rate limiting: WAF rate-limiting rules by IP or CF-Connecting-IP
 * These fire before the request reaches Vercel — zero app overhead.
 *
 * For app-level enforcement (spend caps, schema validation, token logging),
 * this file is the right pattern. It keeps enforcement close to the AI call,
 * avoids a separate sidecar, and works within the Next.js serverless model.
 * ────────────────────────────────────────────────────────────────────────
 */

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SPEND_CAPS = {
  free: 500,
  pro: 50_000,
}

const MAX_BODY_BYTES = 50 * 1024
const MAX_CONTEXT_CHARS = 8000

/**
 * Validate an incoming AI request for size and schema.
 * Returns a Response (rejection) or null (pass through).
 *
 * options.requiredFields  — array of field names that must be present in body
 * options.contextField    — body field name whose string length must be ≤ 8000
 */
export function validateAIRequest(req, body, options = {}) {
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10)
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json(
      { error: `Request body too large. Maximum ${MAX_BODY_BYTES / 1024}KB allowed.` },
      { status: 413 }
    )
  }

  if (options.requiredFields) {
    for (const field of options.requiredFields) {
      if (body[field] == null) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }
  }

  if (options.contextField) {
    const val = body[options.contextField]
    if (typeof val === 'string' && val.length > MAX_CONTEXT_CHARS) {
      return Response.json(
        { error: `Field '${options.contextField}' exceeds maximum ${MAX_CONTEXT_CHARS} characters.` },
        { status: 400 }
      )
    }
  }

  return null
}

/**
 * Check whether the user is under their daily token spend cap.
 * Returns true if allowed, false if over cap.
 * Fails open on DB errors so a Supabase blip never blocks users.
 */
export async function checkSpendCap(userId, tier) {
  const cap = SPEND_CAPS[tier] ?? SPEND_CAPS.free
  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('ai_usage')
      .select('total_tokens')
      .eq('user_id', userId)
      .gte('created_at', dayStart.toISOString())

    if (error) {
      console.error('ai-gateway: spend cap query failed:', error.message)
      return true
    }

    const used = (data || []).reduce((sum, row) => sum + (row.total_tokens || 0), 0)
    return used < cap
  } catch (err) {
    console.error('ai-gateway: spend cap check error:', err.message)
    return true
  }
}

/**
 * Log token usage for an AI request to the ai_usage table.
 * For non-token APIs (e.g. image generation), pass 0/0 and a descriptive model name.
 */
export async function logTokenUsage(userId, endpoint, model, inputTokens, outputTokens) {
  try {
    const supabase = getSupabase()
    await supabase.from('ai_usage').insert({
      user_id: userId,
      endpoint,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    })
  } catch (err) {
    console.error('ai-gateway: failed to log token usage:', err.message)
  }
}
