# Senate eFD bot-defense — diagnosis and fix, August 29, 2026

Resolves the root cause behind `senate_trades` / `senate_net_worth` staying
at 0 rows even after `docs/automate-ingest-2026-08-26.md` put the ingest on
a schedule. Scheduling wasn't the problem — the requests themselves were
being blocked before they ever reached usable data.

## What was wrong

`scripts/ingest-senate-trades.mjs` and `scripts/ingest-senate-networth.mjs`
drove the CSRF/session dance (`GET /search/home/` → accept terms →
`GET /search/` → `POST /search/report/data/`) with raw `fetch()`. That flow
got HTTP 503 from `efdsearch.senate.gov` essentially every time:

- `ingest-senate.log` (local runs, residential IP): 4,722 of 4,724 probes
  over a continuous ~16-hour window returned 503.
- The GitHub Actions workflow (Azure datacenter IP), added 2026-08-27, hit
  the same wall.

The identical multi-step flow driven by a real Chrome browser — same
network, same day — worked cleanly every time it was tested: agreement
accepted, search submitted, PTR data returned with 200s throughout. That
rules out an actual site outage. The 503 is the site's bot defense
rejecting the request's fingerprint (most likely TLS/HTTP2 handshake
shape and/or missing browser headers that a raw Node `fetch()` can't
reproduce), not a real "site is down."

A second, independent bug was found while confirming this: the raw-fetch
scripts posted `filer_type=1` / `report_type=11` (singular, bare values).
Instrumenting a live, working browser session showed the real DataTables
request uses `filer_types=[1]` / `report_types=[11]` — plural fields,
JSON-array-encoded as strings — and a `submitted_start_date` /
`submitted_end_date` with a time component (`MM/DD/YYYY 00:00:00`, not
bare `MM/DD/YYYY`). Whether this alone would have produced wrong results
independent of the WAF block is untested — no request ever got far enough
past the 503 to tell — but it's fixed regardless.

## The fix

`scripts/lib/senate-efd-browser.mjs` (new) drives an actual headless
Chromium session via Playwright: real TLS/HTTP2 fingerprint, real headers,
nothing hand-crafted. `probe-senate-efts.mjs`, `ingest-senate-trades.mjs`,
and `ingest-senate-networth.mjs` were rewritten to use it. The exact
request contract (field names, array encoding, date format) was
reverse-engineered by instrumenting a real, working browser session
against the live site — not guessed — so the rewrite matches what the UI
actually sends, byte for byte.

Everything downstream of "how do we fetch these bytes" is unchanged:
amount parsing, PDF-to-text extraction, Schedule A/D parsing, and the
Supabase upserts are identical to the previous version.

`.github/workflows/ingest-senate.yml` now also installs the Playwright
Chromium browser (`npx playwright install --with-deps chromium`), the same
way it already installs `poppler-utils` for `pdftotext`.

**Known gap: `package-lock.json` is not yet updated in this commit.**
`package.json` now lists `playwright` as a dependency, but the regenerated
lockfile (`npm install --package-lock-only`, ~330KB) couldn't be pushed in
the same change — the tooling used to prepare this commit reads/transfers
file content through a size-limited channel, and this file exceeds it.
Rather than block the whole fix on that, `ingest-senate.yml`'s dependency
install step uses `npm install` instead of `npm ci` for now — `npm install`
resolves and installs `playwright` fine even against a stale lockfile;
`npm ci` would hard-fail on the mismatch. Follow-up (whenever convenient,
no urgency): from a normal dev machine, run `npm install` in the repo root,
commit the updated `package-lock.json`, and switch that workflow step back
to `npm ci` for reproducible installs.

## What this does NOT resolve, and how you'll know

Two things this fix cannot rule out from inside this sandbox:

1. **IP/ASN-level blocking.** If `efdsearch.senate.gov`'s bot defense also
   blocks by IP reputation (common for gov sites against cloud/datacenter
   ranges — GitHub Actions runners are Azure IPs), a perfect browser
   fingerprint from a GitHub-hosted runner could still get blocked. The
   diagnostic browser session that worked was run from a different
   network, not from GitHub's infrastructure.
2. **This sandbox cannot test any of this itself.** Its network egress
   blocks both `efdsearch.senate.gov` directly and the Playwright browser
   download CDN (`cdn.playwright.dev`) — confirmed while building this fix
   (`playwright install chromium` failed with "Connection blocked by
   network allowlist" here). Static review, a syntax check
   (`node --check`), and reverse-engineering the request contract via a
   real browser session are as far as verification could go before
   this shipped. **The first scheduled or manually-dispatched run of
   `ingest-senate.yml` after this merges is the real test.**

How to read that first run:

- **Probe step succeeds, trades/networth steps run and insert rows** — the
  fix worked outright.
- **Probe step fails with a real error message** (not just "503") — check
  the Actions log for what `openSenateSession()` threw; the session/DOM
  selectors may need adjusting if the site's markup changed.
- **Probe step or later steps still 503 specifically** — that points to
  the IP/ASN scenario in (1). At that point the honest options are a
  self-hosted runner on non-datacenter egress, or a residential proxy
  vendor — both add cost/complexity, and the second is worth a deliberate
  call for a civic-transparency product rather than a default reach.

## Related, considered and set aside

Two community-maintained mirrors of Senate PTR data were evaluated as a
possible parallel/fallback source for `senate_trades`
(`timothycarambat/senate-stock-watcher-data`,
`jeremiak/us-senate-financial-disclosure-data` — the latter's companion
Heroku app is also presumably down). Both are abandoned: last real data
commit 2020-12-05 and 2024-01-14 respectively, confirmed via GitHub commit
history, not assumed from README text (which describes them as
continually updated — that description is stale). Neither is safe to wire
in as a live source. They could still serve as a one-time historical
backfill (both include senator name/date/amount; the newer one covers
more schedule types) if Marc wants a non-empty baseline while this fix
proves itself — not implemented here since it wasn't part of what was
approved.
