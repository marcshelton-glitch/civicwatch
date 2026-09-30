import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { inspectRequest } from './waf.mjs'
import { isBanned, recordBlock } from './bans.js'

// ── Request guard: WAF + ban check + alerting ────────────────────────────────
// Called first thing in proxy.ts. Returns a 403 NextResponse to stop the request,
// or null to let it continue to Clerk and the routes.
//
//   WAF_MODE=block  (default) reject matching requests
//   WAF_MODE=log    detect, record and alert, but let the request through —
//                   use this to watch for false positives after a rule change
//   WAF_MODE=off    kill switch, everything below is skipped
//   SECURITY_IP_ALLOWLIST=1.2.3.4,5.6.7.8   never inspect/ban these (your own IPs)
//   WAF_SPIKE_THRESHOLD=30                  blocks/10min site-wide that trigger an alert
//
// Alerting (Step 3) is Sentry: new bans and block spikes are captured with the
// tag `security`, so one Sentry alert rule on `security:*` emails you.

// Server-to-server callers that authenticate themselves and never carry a
// browser-shaped query string. Exempt from inspection so a Stripe or Clerk
// retry can never be counted as an attack and banned.
const EXEMPT = /^\/api\/(webhooks\/|push\/send|send-alerts|alerts\/x-bot)/

const forbidden = () =>
  new NextResponse('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } })

function clientIp(request) {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  )
}

const allowlist = new Set(
  (process.env.SECURITY_IP_ALLOWLIST || '').split(',').map((s) => s.trim()).filter(Boolean)
)

async function alert(message, level, tags, extra) {
  try {
    Sentry.captureMessage(message, { level, tags: { security: 'true', ...tags }, extra })
    // Serverless may freeze right after the response; give Sentry time to send.
    await Sentry.flush(2000)
  } catch {
    /* alerting must never break a request */
  }
}

export async function guardRequest(request) {
  const mode = process.env.WAF_MODE || 'block'
  if (mode === 'off') return null

  const ip = clientIp(request)
  if (ip && allowlist.has(ip)) return null

  const { pathname, searchParams } = request.nextUrl

  // Banned IPs are refused outright — including on exempt routes.
  if (mode === 'block' && ip && (await isBanned(ip))) return forbidden()

  if (EXEMPT.test(pathname)) return null

  const hit = inspectRequest({
    pathname,
    searchParams,
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  })
  if (!hit) return null

  const rule = `${hit.rule}:${hit.where}`
  console.warn(`[waf] ${mode === 'block' ? 'blocked' : 'detected'} ip=${ip} rule=${rule} path=${pathname}`)

  if (ip) {
    const r = await recordBlock(ip, rule, pathname)
    if (r?.newBan) {
      // Constant message on purpose: Sentry groups by message, so every ban lands
      // in ONE issue and the alert rule emails at most once per throttle window,
      // instead of one email per attacker IP during a distributed attack. The IP
      // and rule are searchable as tags and visible in the event's extra data.
      await alert('WAF ban issued', 'warning', { security: 'ban', banned_ip: ip }, {
        ip, rule, bannedUntil: r.bannedUntil, blocksIn10Min: r.ipBlocks,
      })
    }
    // Fire exactly when the site-wide count crosses the threshold, not on every
    // block after it, so a sustained attack is one alert instead of hundreds.
    const spike = Number(process.env.WAF_SPIKE_THRESHOLD) || 30
    if (r && r.globalBlocks === spike) {
      await alert('WAF spike: blocked-request volume crossed threshold', 'error', { security: 'spike' }, {
        globalBlocks: r.globalBlocks, threshold: spike, latestIp: ip, latestRule: rule,
      })
    }
  }

  return mode === 'block' ? forbidden() : null
}
