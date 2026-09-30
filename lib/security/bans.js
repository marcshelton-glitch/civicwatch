import { createClient } from '@supabase/supabase-js'

// ── Escalating IP bans (Step 2: "fail2ban") ──────────────────────────────────
// Storage and escalation live in Postgres (supabase/migrations/
// 20260929000001_security_waf_bans.sql). This module is the thin client.
//
// Why a cached list instead of a lookup per request: proxy.ts runs on EVERY
// request, and Supabase is on the free tier. The ban list is tiny, so each warm
// instance pulls it once per 30s. Cost: one small query per instance per 30s
// regardless of traffic. Trade-off: a ban made on another instance can take up
// to 30s to reach this one; the instance that issues a ban applies it instantly.
//
// Everything fails OPEN. If Supabase is slow, down, or the migration has not
// been applied yet, nobody is banned and the site keeps serving.

const REFRESH_MS = 30_000
const TIMEOUT_MS = 2000

let supabase
const getSupabase = () =>
  (supabase ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  }))

let cache = { at: 0, ips: new Set() }

async function refresh() {
  // Stamp first so a slow/failed refresh can't trigger a stampede of retries.
  cache.at = Date.now()
  try {
    const { data, error } = await getSupabase()
      .from('ip_bans')
      .select('ip')
      .gt('banned_until', new Date().toISOString())
      .limit(5000)
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
    if (error) console.error('[bans] refresh failed:', error.message)
    else if (data) cache.ips = new Set(data.map((r) => r.ip))
  } catch (e) {
    console.error('[bans] refresh threw:', e?.message) // fail open
  }
}

export async function isBanned(ip) {
  if (!ip) return false
  if (Date.now() - cache.at > REFRESH_MS) await refresh()
  return cache.ips.has(ip)
}

/**
 * Log a WAF block. The DB function decides whether this IP has now earned a ban.
 * @returns {Promise<{ newBan: boolean, bannedUntil: string|null, ipBlocks: number, globalBlocks: number } | null>}
 */
export async function recordBlock(ip, rule, path) {
  try {
    const { data, error } = await getSupabase()
      .rpc('security_record_block', { p_ip: ip, p_rule: rule, p_path: path })
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
    if (error || !data?.length) {
      console.error('[bans] recordBlock failed:', error?.message ?? 'empty result')
      return null
    }
    const r = data[0]
    if (r.out_new_ban) cache.ips.add(ip)
    return {
      newBan: r.out_new_ban,
      bannedUntil: r.out_banned_until,
      ipBlocks: r.out_ip_blocks,
      globalBlocks: r.out_global_blocks,
    }
  } catch (e) {
    console.error('[bans] recordBlock threw:', e?.message)
    return null
  }
}
