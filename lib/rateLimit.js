import { createClient } from '@supabase/supabase-js'

// ── Durable, cross-instance rate limiter ──────────────────────────────────────
// Backed by the `rate_limits` Postgres table (supabase/migrations/
// 20260615000000_create_rate_limits.sql). That migration shipped back in June
// but nothing in the app ever queried or wrote to the table — confirmed via a
// direct count against production (0 rows, ever) on 2026-08-25. The routes that
// were supposed to use it (congress, public-feed, leaderboard) each rolled
// their own in-memory `Map()`-based limiter instead.
//
// The problem with the in-memory version: it lives in module-level state
// inside one serverless function instance. Vercel runs many concurrent
// instances under real traffic, each with its own empty Map — so "30 calls
// per minute" was only ever enforced per warm instance, not globally per
// IP/user the way the feature was designed and marked "done" for. A real
// burst of concurrent requests (a traffic spike, or literally our own k6
// stress test) could land across enough parallel instances to blow well past
// the intended ceiling.
//
// This function is meant to run ALONGSIDE the existing in-memory check in
// each route, not replace it — the in-memory check is still a cheap, useful
// fast-fail for repeat hits landing on the same instance. This is the
// authoritative, cross-instance backstop that makes the limit real.
//
// Trade-off worth knowing: this adds one indexed COUNT + one INSERT against
// Supabase on every request that isn't served from Vercel's edge cache (i.e.
// every request that actually reaches route code). For these three routes
// that's relatively infrequent given their s-maxage caching, so the added
// load should be modest — but it's not free, and worth watching if these
// routes' latency profile changes after this ships.

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * @param {string} key - Rate limit identity: Clerk userId when available, else IP.
 * @param {string} action - Route name, e.g. 'congress', 'leaderboard', 'public-feed'.
 * @param {number} maxCalls - Max allowed calls within windowSeconds.
 * @param {number} windowSeconds - Sliding window size in seconds. Default 60.
 * @returns {Promise<boolean>} true if this call should be rejected as rate limited.
 */
export async function isRateLimitedDurable(key, action, maxCalls, windowSeconds = 60) {
  const supabase = getSupabase()
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  let count, countError
  try {
    ;({ count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', key)
      .eq('action', action)
      .gte('created_at', windowStart)
      .abortSignal(AbortSignal.timeout(3000)))
  } catch (e) {
    countError = e
  }

  if (countError) {
    // Fail OPEN on infra errors (including a timeout) — a slow or unreachable
    // Supabase shouldn't take these routes down entirely, or make every
    // request pay the full 3s wait. The in-memory check in the caller still
    // applies regardless.
    console.error(`[rateLimit] count check failed for action=${action}:`, countError.message)
    return false
  }

  if ((count ?? 0) >= maxCalls) {
    return true
  }

  try {
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({ user_id: key, action })
      .abortSignal(AbortSignal.timeout(3000))

    if (insertError) {
      console.error(`[rateLimit] insert failed for action=${action}:`, insertError.message)
    }
  } catch (e) {
    console.error(`[rateLimit] insert threw for action=${action}:`, e.message)
  }

  // Opportunistic cleanup — roughly 1 in 200 allowed calls also prunes rows
  // older than the retention window the original migration's comment called
  // for (24h), so the table doesn't grow unbounded without needing a
  // separate cron job. Cheap and safe to skip most of the time.
  if (Math.random() < 0.005) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', cutoff)
      .then(({ error: cleanupError }) => {
        if (cleanupError) console.error('[rateLimit] cleanup failed:', cleanupError.message)
      })
  }

  return false
}
