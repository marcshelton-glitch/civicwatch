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

## Round two: the WAF fix worked, but the site had also been redesigned

The first live run after the fix above (`Ingest Senate Disclosures #7`,
manually dispatched) came back green — "Success" in the GitHub Actions UI.
Marc reported this as working. It wasn't: `senate_trades` and
`senate_net_worth` were both still at 0 rows in Supabase. That gap between
a green checkmark and actual data is fully explained by
`ingest-senate.yml`'s own design — the trades/net-worth steps run with
`continue-on-error: true` so a probe outage (the original WAF scenario)
doesn't fail the whole job, and the final "fail run if a phase failed"
step only fires when `steps.probe.outcome == 'success'` **and** a phase
outcome is literally `'failure'`. A phase that runs, throws no error, and
simply inserts zero rows reports `'success'` — so the job as a whole goes
green even when it accomplishes nothing. Reading the actual step logs
showed the real picture: probe `status=200` (the WAF fix genuinely
worked), then PTR trades "Found 1689 PTR filings ... inserted: 0, skipped:
1689", and net worth "Found 1599 Annual FD filings ... Processing 100
filings" with every single one logging "no link".

Root cause, confirmed by instrumenting a real authenticated browser session
against the live site directly (fetch() calls and DOM queries executed in
the actual page context, not guessed from old markup): the site had been
redesigned independently of the WAF issue, in ways that broke every
filing-level assumption downstream of the search call.

1. **Search result rows are 5 columns, not 6.** The live DataTables
   response for `/search/report/data/` is
   `[first_name, last_name, office, link_html, date_filed]`. The old code
   destructured a 6th, separate trailing link field that never existed in
   this shape — `link_html` (containing the filing's href) was silently
   `undefined`, which is why every row logged "no link" and was skipped
   before any per-filing fetch was even attempted.
2. **The per-report `data.json` API is gone.** Both
   `/search/report/ptr/{uuid}/data.json` and
   `/search/view/ptr/{uuid}/data.json` return live 404s. There is no JSON
   endpoint for an individual filing's line items anymore.
3. **PDFs are gone.** Every report — PTR and Annual FD alike — is now a
   fully server-rendered HTML page. There is nothing to download or run
   `pdftotext` against.
4. **The href path changed.** Real links point to `/search/view/ptr/{uuid}/`
   and `/search/view/annual/{uuid}/`. The old UUID-extraction regex looked
   for `/search/report/ptr/` — a path that was never real — so even had
   `link_html` been read correctly, the UUID match would still have failed.

Each filing's data now lives directly in the view page's DOM, as
`<table>` elements identified by a `<caption>` (e.g. "List of transactions
added to this report", "List of assets added to this report", "List of
liabilities added to this report"). Annual FD reports are organized into
numbered "Parts" (1 Honoraria, 2 Earned Income, 3 Assets, 4a/4b PTR
Summary/Transactions, 5 Gifts, 6 Travel, 7 Liabilities, 8 Positions, 9
Agreements, 10 Compensation), all rendered as plain HTML tables.

### The fix

`scripts/lib/senate-efd-browser.mjs` gained `scrapeReportTables(context,
hrefOrUrl)`, which navigates to a filing's view page and returns every
table on it as `{ caption, headers, rows }` — plain-text cells, read
straight from the rendered DOM. `findTableByCaption` looks one up by its
exact caption text; a `null` result is the normal case for a filer who
answered "No" to that section, not an error. `resolvePdfUrl` /
`downloadBinary` are left in the module (now documented as legacy/unused)
rather than deleted, in case a rare edge case still needs them, but
neither script calls them anymore.

`scripts/ingest-senate-trades.mjs` now destructures the real 5-column
search row, extracts the href from `link_html`, matches the UUID against
`/search/view/ptr/`, and reads trade line items from the "List of
transactions added to this report" table (9 cells per row: `#,
Transaction Date, Owner, Ticker, Asset Name, Asset Type, Type, Amount,
Comment`) — using the real Ticker column directly instead of regexing a
ticker out of the asset name string, which is more reliable than the old
approach.

`scripts/ingest-senate-networth.mjs` had its entire PDF pipeline
(`resolvePdfUrl` → `downloadBinary` → `pdftotext` → regex-based
`parseNetWorth`) removed and replaced with `scrapeReportTables` +
`computeNetWorth`/`sumRangeColumn`, which sum dollar-range values directly
out of the live Assets table (value at cell index 4; rows showing `--`
are parent/grouping rows like a brokerage account whose real range lives
on numbered sub-rows, e.g. "2.1" — skipped because they carry no
independent value) and Liabilities table (amount at cell index 7). The
dollar-range string format itself (`$1,001 - $15,000`, "Over $50,000,000",
etc.) is unchanged from before, so `parseRange`/`AMOUNT_MAP` needed no
changes. The `pdf_url` column now stores the resolved view-page URL rather
than a literal PDF link — a naming mismatch left as-is rather than
renaming a production column over a doc-only concern.

This second round could only be diagnosed by actually reading the report
pages live — the original rewrite's design (get a real browser session
past the WAF) was correct, but a script can only be as right as its
assumptions about the site's current markup, and those assumptions had
gone stale independently of the WAF problem it was built to solve.

### The verification-status lesson

A green "Success" status on this workflow proves the job didn't crash — it
does not prove any row landed in the database. Given the intentional
`continue-on-error` design (necessary so a genuine site outage doesn't
mark the whole scheduled job as broken), the only real signal is checking
`senate_trades` / `senate_net_worth` row counts directly, or reading the
step-level logs for `inserted:` / `ok=` counts greater than zero. Trust
the data, not the checkmark.
