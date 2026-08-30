#!/usr/bin/env node
// Probe script: exits 0 and prints "200" if the Senate eFD search is live and
// reachable, else prints a status/error and exits 1.
//
// Rewritten 2026-08-29 to use a real headless browser (Playwright) instead of
// raw fetch(). The raw-fetch version was blocked by efdsearch.senate.gov's
// bot defense essentially 100% of the time (see ingest-senate.log and
// docs/senate-waf-2026-08-29.md), which meant this probe reported "down" even
// during the many hours real users could load the site fine in a browser.
// A probe that's wrong in that direction is worse than no probe: it makes
// the whole daily ingest look like it's correctly skipping an outage when
// really it never had a chance to run.
//
// This intentionally stays a lightweight, standalone check (not a full
// search) — it only needs to confirm the session/agreement flow still works
// before the heavier trades/networth steps pay the cost of a full run.

import { openSenateSession } from './lib/senate-efd-browser.mjs'

async function run() {
  let browser
  try {
    const session = await openSenateSession()
    browser = session.browser
    console.log(200)
    process.exit(0)
  } catch (e) {
    console.log('ERROR: ' + e.message)
    process.exit(1)
  } finally {
    if (browser) await browser.close()
  }
}

run()
