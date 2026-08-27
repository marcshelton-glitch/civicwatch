# Automating ingest off the Mac

Resolves item 3 in `docs/prelaunch-audit-2026-08-03.md` ("Automate ingest off
your Mac — Vercel cron on a paid plan, or a GitHub Action") and the root cause
behind item 8 (`senate_trades` / `senate_net_worth` both empty — nothing was
scheduled to run the Senate scripts at all).

## What changed

Two new workflows, both GitHub Actions rather than Vercel cron:

- `.github/workflows/ingest-house.yml` — House disclosures (index → trades →
  net worth), every 6 hours.
- `.github/workflows/ingest-senate.yml` — Senate PTR trades + net worth, once
  daily.

Both call the existing `scripts/ingest-*.mjs` CLIs unchanged — no script
rewrites, just a scheduler that isn't your laptop.

## Why GitHub Actions, not Vercel cron

Two blockers ruled out a straight Vercel cron on the current (Hobby) plan:

1. **Hobby accounts allow one cron run per day, full stop.** A bad cron entry
   fails deployment *validation* silently — see `docs/vercel-cron-limits.md`
   for the six-week outage that caused. `ingest-house.yml`'s 6-hour cadence
   would hit the same wall.
2. **`ingest-senate-networth.mjs` shells out to `pdftotext`** (poppler-utils).
   Vercel serverless functions don't ship that binary and there's no apt-get
   inside a function — it would need a bundled binary or a rewrite. GitHub's
   `ubuntu-latest` runner already has apt; the workflow just installs it.

GitHub Actions is free for this repo's usage pattern, keeps the existing
scripts as-is, and `.github/workflows/` was already established here
(`ai-review.yml`). Upgrading to Vercel Pro remains an option later if you'd
rather consolidate scheduling in one place — nothing here forecloses that.

## One-time setup

Add two repository secrets — same values as in Vercel:

`github.com/marcshelton-glitch/civicwatch/settings/secrets/actions`

| Secret | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | same as Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | same as Vercel — server-only, bypasses RLS |

Nothing else to configure. Neither workflow touches `vercel.json` or the app's
API routes — they write to Supabase directly, exactly like the scripts always
have.

## Schedule choices

- **House, every 6 hours (`13 */6 * * *`):** `--phase=trades` and
  `--phase=networth` only process *unprocessed* rows (bounded by `--limit`),
  so frequent runs just drain the backlog faster without re-doing work.
  `--phase=index` is passed `--year=<current year>` on the schedule (fast,
  incremental) rather than the full 2008–present backfill `ingest-loop.sh`
  never actually needed to repeat. Run the workflow manually with `year=all`
  if a full re-index is ever needed.
- **Senate, once daily (`47 8 * * *`):** efdsearch.senate.gov is a
  CSRF/session-protected Django endpoint with its own 503 backoff logic
  already written into `ingest-senate-networth.mjs`. A 6-hour cadence there
  would be hammering a fragile government site for no real benefit — trades
  and net worth filings don't arrive fast enough to need it. The workflow
  probes the endpoint first (`probe-senate-efts.mjs`) and skips cleanly if
  it's down, rather than retrying in a loop and burning Actions minutes.

Both are also `workflow_dispatch`-triggered, so you can run either on demand
from the Actions tab with custom `--limit` values.

## What this does NOT automate (on purpose)

- **`scripts/ocr-pipeline.js`** — scanned House PDFs via Google Vision.
  Costs real money per call (`GOOGLE_VISION_API_KEY`, currently unset per
  `.env.example`) and also shells out to `pdftoppm`/`gs`. Wire this up once
  you've decided you want that spend running unattended.
- **`scripts/ingest-committees.mjs`** — committee membership snapshot from a
  static dataset (`unitedstates/congress-legislators`). Changes rarely; a
  scheduled run buys little. Run manually (`--apply`) after a Congress
  reorganizes committees.
- **`scripts/backfill-trades-bioguide.mjs`** — one-time backfill, dry-run by
  default on purpose ("read the report before writing"). Not something that
  should run unattended.

## Cleanup

`ingest-loop.sh` and `ingest-senate-loop.sh` hardcode a path under
`/Users/marcshelton/civicwatch/...` and are now redundant for production
ingest — the workflows above cover the same ground without needing your
laptop open. Safe to delete, or keep them for local one-off debugging; either
way, don't rely on them for the ongoing refresh anymore.
