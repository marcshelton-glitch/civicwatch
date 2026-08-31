---
doc: twelve-factor
project: civicwatch
profile: server
status: active
owner: Marc Shelton
last_reviewed: 2026-08-11
review_cadence: 90d
gantt_tasks: []
---

# Twelve-Factor Living Document — CivicWatch

**Profile: `server`** — Next.js on Vercel with Supabase, Clerk, Stripe, Resend,
Sentry. All twelve factors are in scope.

Scored 2026-08-11 against the actual repository, not from memory. Where I could
not verify something in this environment it is marked **unverified** rather
than assumed.

## Scorecard

| # | Factor | Status | Owner | Evidence / justification |
|---|---|---|---|---|
| I | Codebase | partial | Marc | Git repo with remote `github.com/marcshelton-glitch/civicwatch`. **39 uncommitted changes**, most of them untracked business documents sitting loose in the working tree. |
| II | Dependencies | partial | Marc | Original finding (no `engines`/`.nvmrc`, Node version unpinned) stands. VibeCheck scan below confirms zero `package.json` deps pinned to `*`/`latest` — a different, narrower check than Node-version pinning; doesn't change this row. |
| III | Config | **fail** | Marc | Original finding (35 undocumented `process.env.*` vars, no `.env.example`) stands. VibeCheck scan below confirms zero leaked secrets/committed `.env` in code — the "secrets are correctly gitignored" part was already known to be good; the undocumented-required-set problem is separate and unresolved. |
| IV | Backing services | pass | Marc | Supabase, Clerk, Stripe, Resend, Sentry, Anthropic, plus 6 civic-data APIs — all reached through env vars, none hardcoded. Failure modes per service are **not documented**; see `50-legal/security-privacy.md`. |
| V | Build, release, run | partial | Marc | Vercel separates build/release/run properly and gives immutable deployments with one-click rollback. But `package.json` is pinned at `version: 0.1.0` and never moves, so a release has no human-meaningful identity — you cannot say "0.4.2 is in prod." |
| VI | Processes | pass | Marc | Next.js on Vercel is stateless serverless. Session state is Clerk's, data is Supabase's; nothing depends on local disk between requests. |
| VII | Port binding | pass | Marc | `next start` binds `PORT`; Vercel supplies it. Self-contained, no injected webserver. |
| VIII | Concurrency | pass | Marc | Serverless functions scale horizontally without code change. Scheduled work is properly separated: `vercel.json` runs `/api/send-alerts` on a cron rather than inside a user request. |
| IX | Disposability | partial | Marc | Serverless startup/teardown handled by the platform; cron/ingest idempotency still **unverified**. VibeCheck scan below adds real, non-hypothetical evidence: **48 unhandled-async sites** — worth checking whether any sit in the cron/ingest paths first. |
| X | Dev/prod parity | partial | Marc | Same Supabase and same services across environments — good. Undermined by the unpinned Node version and the missing `.env.example`, which together mean a fresh dev environment is assembled by guesswork. |
| XI | Logs | **partial** | Marc | Downgraded from `pass` 2026-08-20: VibeCheck scan below found **130 stray `console.log` calls** — not "logs as an event stream," scattered ad hoc output alongside the real Sentry wiring. Sentry (`instrumentation.js`, `instrumentation-client.js`, `sentry.edge.config.js`) is still real and good; the correction is that "no other logging path exists" was wrong. Sharpens the existing PII concern below — console.log bypasses whatever scrubbing the Sentry pipeline does. **Unverified:** whether any of the 130 calls or a Sentry breadcrumb carries user PII — now with concrete call sites to check first. |
| XII | Admin processes | partial | Marc | Migrations are explicit, numbered, and reviewable (`001_…` → `010_…`) and ingest jobs are real npm scripts, not hidden startup side effects — both good. **But migrations exist in two places, `migrations/` and `supabase/migrations/`**, and it is not obvious which is authoritative. Ambiguity about which migration set is real is exactly the condition that produces a bad production migration. |

**Rollup:** pass `4` · partial `7` · fail `1` · n/a `0` · by-design `0`
(XI moved from `pass` to `partial` 2026-08-20 after the VibeCheck scan below
found 130 stray `console.log` calls — see the row for detail.)

---

## The three findings worth acting on

**1. No `.env.example` (Factor III) — highest value, lowest effort.**
Thirty-five variables, discoverable only by grepping. This is also the single
biggest obstacle to the autonomous-manager endstate: an agent cannot provision
or validate an environment it has to infer. Generating it is mechanical —
the variable names are already extracted below.

**2. Two migration directories (Factor XII).**
`migrations/` and `supabase/migrations/` both exist. One is authoritative and
the other is a leftover, but nothing in the repo says which. The failure mode
is someone applying the wrong set to production.

**3. No release identity (Factor V).**
`0.1.0` has never moved. Vercel gives you rollback, so the risk isn't recovery
— it's diagnosis. When a user reports a bug you cannot tie it to a build.

**4. 130 stray `console.log` calls, some plausibly logging PII (Factor XI) —
added 2026-08-20 via VibeCheck.** CivicWatch handles user location and
political-preference data; every `console.log` is a potential unscrubbed
leak of exactly that. Sentry wiring is real and good — this is about
everything that *isn't* going through it. See the VibeCheck scan in the
Scorecard's XI row for the finding count; run
`_standard/bin/vibecheck-scan.sh civicwatch` for the full file:line list.

Everything else is either fine or a known-and-accepted gap.

## Referenced environment variables

Extracted from `app/`, `lib/`, `scripts/`, `components/` on 2026-08-11. Use
this to generate `.env.example`.

```
ADMIN_EMAILS                              LEGISCAN_API_KEY
AIRBRUSH_API_KEY                          NEXT_PUBLIC_APP_URL
CICERO_API_KEY                            NEXT_PUBLIC_GA_MEASUREMENT_ID
CLERK_WEBHOOK_SECRET                      NEXT_PUBLIC_META_PIXEL_ID
CONGRESS_API_KEY                          NEXT_PUBLIC_OG_IMAGE_ENABLED
CRON_SECRET                               NEXT_PUBLIC_PROMO_CHECKOUT_URL
GOOGLE_AI_API_KEY                         NEXT_PUBLIC_PROMO_MODE
GOOGLE_VISION_API_KEY                     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
INTERNAL_API_SECRET                       NEXT_PUBLIC_SUPABASE_URL
NODE_ENV                                  NEXT_PUBLIC_TIKTOK_PIXEL_ID
OPENSTATES_API_KEY                        NEXT_PUBLIC_VAPID_PUBLIC_KEY
RESEND_API_KEY                            STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_PRICE_ID                       SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY                         VAPID_PRIVATE_KEY
STRIPE_WEBHOOK_SECRET                     VAPID_SUBJECT
VERCEL_ENV                                X_BOT_ACCESS_TOKEN
X_BOT_ACCESS_TOKEN_SECRET                 X_BOT_CLIENT_ID
X_BOT_CLIENT_SECRET
```

## Decisions needed

- **D-001** — which migration directory is authoritative
- **D-002** — whether to move the loose business documents into the standard structure

<!-- BEGIN vibecheck-scan 2026-08-20 -->
### VibeCheck scan — 2026-08-20

Scanned `.` with VibeCheck (heuristic regex/structural scanner, not a
type-checker -- findings are evidence to investigate, not a final verdict).
Auto-generated by `_standard/bin/vibecheck-scan.sh` -- re-run it to refresh this
block rather than editing it by hand.

Only 4 of the 12 factors have a defensible code-checkable mapping. The other 8
(I, IV, V, VI, VII, VIII, X, XII) are not touched by this scan and still need a
human to score them above.

**II. Dependencies — `pass`**
- No matching findings. VibeCheck only sees `.js .jsx .mjs .cjs .ts .tsx .mts .cts` files, so this is not a pass for any Swift/Kotlin/Python/etc. code in the same project.

**III. Config — `pass`**
- No matching findings. VibeCheck only sees `.js .jsx .mjs .cjs .ts .tsx .mts .cts` files, so this is not a pass for any Swift/Kotlin/Python/etc. code in the same project.

**IX. Disposability — `partial`**
- `CivicHub.jsx:268` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/alerts/x-bot/route.js:60` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/alerts/x-bot/route.js:124` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/civic/route.js:45` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/civic/route.js:55` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/civic/route.js:67` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/civic/route.js:172` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/conflict-score/route.js:42` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/conflict-score/route.js:67` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- `app/api/congress/route.js:83` (medium) — async function uses await with no try/catch in its body — unhandled rejections will crash silently or bubble unexpectedly
- …and 38 more of the same rule, run `vibecheck-scan.sh` output directly for the full list.

**XI. Logs — `partial`**
- `app/api/push/send/route.js:98` (low) — console.log left in source
- `app/api/send-alerts/route.js:183` (low) — console.log left in source
- `app/api/webhooks/clerk/route.js:94` (low) — console.log left in source
- `app/api/webhooks/stripe/route.js:254` (low) — console.log left in source
- `app/api/webhooks/stripe/route.js:294` (low) — console.log left in source
- `app/api/webhooks/stripe/route.js:331` (low) — console.log left in source
- `app/api/webhooks/stripe/route.js:403` (low) — console.log left in source
- `app/api/webhooks/stripe/route.js:450` (low) — console.log left in source
- `lib/airbrush.js:35` (low) — console.log left in source
- `scripts/backfill-bioguide.js:49` (low) — console.log left in source
- …and 120 more of the same rule, run `vibecheck-scan.sh` output directly for the full list.

*2 additional VibeCheck finding(s) on other rules (secrets-adjacent, XSS, validation, hygiene) -- real, but not a 12-factor concern, not rolled up here.*

<!-- END vibecheck-scan -->

## Change history

| Date | Change | By |
|---|---|---|
| 2026-08-11 | Scaffolded from `_standard` v1.0.0 and scored against the live repo | Claude |
