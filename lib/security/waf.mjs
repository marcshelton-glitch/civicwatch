// ── Application-layer WAF (Step 1 of the hardening protocol) ─────────────────
// civicwatch runs on Vercel, so there is no Nginx to bolt ModSecurity onto. This
// is the in-app equivalent: a small rule set modelled on the OWASP Core Rule Set
// categories (SQLi, XSS, RCE, path traversal, scanner fingerprints), run from
// proxy.ts before any route code or Clerk work happens.
//
// Pure functions, no I/O, so it is unit-tested in scripts/test-waf.mjs.
//
// Deliberate limits — read before "fixing" a false negative:
//   * Inspects the URL (path + query values) and User-Agent/Referer only. Request
//     bodies are NOT read here: proxy would have to buffer them for every route.
//     Routes that take free-text bodies should call inspectValue() themselves.
//   * Rules are multi-token on purpose ("union select", "or 1=1"), never bare
//     words, because this is a search-heavy site and "select", "union", "drop"
//     are normal English in a legislator's name or a bill title.
//   * Every regex is bounded and input is capped at MAX_VALUE, so a hostile
//     request cannot turn the WAF itself into a ReDoS vector.

const MAX_VALUE = 2048

const SCANNER_UA =
  /(sqlmap|nikto|nmap|masscan|acunetix|nessus|wpscan|dirbuster|gobuster|havij|zgrab|nuclei|jaeles|fimap|w3af|openvas)/i

// Paths nothing on this site serves — only scanners ask for them.
const PROBE_PATH =
  /^\/(\.env|\.git|\.svn|\.hg|\.aws|\.ssh|\.ds_store|wp-(admin|login|content|includes)|wordpress|xmlrpc\.php|phpmyadmin|pma|cgi-bin|vendor\/phpunit|server-status|actuator|\.htaccess|\.htpasswd)/i
const PROBE_EXT = /\.(php\d?|aspx?|jsp|cgi)(\/|$)/i

const VALUE_RULES = [
  // Traversal first so ../../etc/passwd is labelled traversal, not rce.
  ['traversal', /\.\.[/\\]|[/\\]\.\.(?:[/\\]|$)/],
  ['traversal', /\0/],
  ['sqli', /\bunion\b[\s/*+]+(all[\s/*+]+)?select\b/i],
  ['sqli', /\b(or|and)\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i],
  ['sqli', /['"]\s*(or|and)\s+['"]?\w+['"]?\s*=\s*['"]?\w+/i],
  ['sqli', /['"]\s*(--|#|\/\*)/],
  ['sqli', /;\s*(drop|alter|truncate|insert|update|delete)\s+\w/i],
  ['sqli', /\b(pg_sleep|sleep|benchmark)\s*\(|waitfor\s+delay/i],
  ['sqli', /information_schema|pg_catalog|sqlite_master/i],
  ['xss', /<\s*script\b/i],
  ['xss', /<\s*(iframe|object|embed)\b/i],
  ['xss', /\bjavascript\s*:/i],
  ['xss', /\bon(error|load|click|mouseover|focus|toggle)\s*=/i],
  ['rce', /\$\{\s*(jndi|env|sys)\s*:/i],
  ['rce', /\$\(|`[^`]{1,80}`/],
  ['rce', /[;|&]\s*(cat|ls|whoami|wget|curl|nc|bash|sh|chmod|uname|powershell)\b/i],
  ['rce', /\/etc\/(passwd|shadow)|\bcmd\.exe\b|\/bin\/(ba)?sh\b|c:\\windows/i],
]

// Params whose values are opaque tokens minted by Clerk/Stripe/OAuth — long,
// base64/JWT-shaped, and not ours to judge. Skipping them avoids blocking sign-in.
const OPAQUE_PARAM = /^(__clerk|state$|code$|session_id$|token$|redirect_url$)/i

function decode(s) {
  let out = s.replace(/\+/g, ' ')
  // Twice, so %252e%252e (double-encoded traversal) is caught too.
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(out)
      if (next === out) break
      out = next
    } catch {
      break
    }
  }
  return out
}

/** Check one string against the value rules. Returns the rule family or null. */
export function inspectValue(value) {
  if (typeof value !== 'string' || !value) return null
  const v = decode(value.slice(0, MAX_VALUE))
  for (const [family, re] of VALUE_RULES) {
    if (re.test(v)) return family
  }
  return null
}

/**
 * @param {{ pathname: string, searchParams: URLSearchParams, userAgent?: string, referer?: string }} req
 * @returns {{ rule: string, where: string } | null}  null = allowed
 */
export function inspectRequest({ pathname, searchParams, userAgent = '', referer = '' }) {
  if (SCANNER_UA.test(userAgent.slice(0, 300))) return { rule: 'scanner', where: 'user-agent' }

  const path = decode(pathname)
  if (PROBE_PATH.test(path) || PROBE_EXT.test(path)) return { rule: 'probe', where: 'path' }

  const pathHit = inspectValue(pathname)
  if (pathHit) return { rule: pathHit, where: 'path' }

  for (const [name, value] of searchParams) {
    if (OPAQUE_PARAM.test(name)) continue
    const hit = inspectValue(name) || inspectValue(value)
    if (hit) return { rule: hit, where: `query:${name.slice(0, 40)}` }
  }

  // Headers reflected into logs/pages are the classic log4shell/XSS carrier.
  const hdr = inspectValue(userAgent) || inspectValue(referer)
  if (hdr) return { rule: hdr, where: 'header' }

  return null
}
