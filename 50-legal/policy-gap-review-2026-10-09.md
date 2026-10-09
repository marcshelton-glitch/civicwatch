---
doc: policy-gap-review
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-10-09
review_cadence: 90d
gantt_tasks: []
---

# CivicWatch — privacy & terms gap review (2026-10-09)

> Machine-assisted review, not legal advice. Compared the **live pages**
> (`app/privacy/page.js`, `app/terms/page.js`) and the code that handles user
> data against General Legal's CC0 templates
> (`~/.claude/skills/legal-templates/templates/`). Nothing in the app was changed.

**Verdict: good bones, but stale and under-disclosing. Fix #1–#4 before the
10-23 launch push** — the Meta pilot ad (#47) is already driving traffic through
the pixels.

## Fix before launch

| # | Gap | Evidence | Fix |
|---|---|---|---|
| 1 | **Terms say the contract is with "CivicWatch LLC"; nothing in the repo shows an LLC exists.** `20-business`/`50-legal` still has the unfilled "LLC / S-Corp / sole prop" row. | `app/terms/page.js` | Check CA Secretary of State bizfile. If no LLC: either form one, or change the Terms to your real name / DBA. Naming a non-existent entity is worse than naming yourself. |
| 2 | **Provider list omits services that receive user data.** §3 names Clerk, Supabase, Stripe, Vercel, Google, Sentry. Code also uses **Anthropic** (`app/api/send-alerts`), **Resend** (`webhooks/clerk`, `webhooks/stripe`, `send-alerts`) and **web push** (`app/api/push/send`). | grep of `app/`, `lib/` | Add Anthropic, Resend, push service to §3. Also say whether AI inputs are used for training (template `privacy-policy-us` "Training data"). Only Gemini is named today. |
| 3 | **Meta + TikTok pixels = "sharing" for cross-context advertising under CCPA**, but the policy only says "we do not sell". It also has no Global Privacy Control language. Consent-gating helps, but the notice should match. | `components/MetaPixel.jsx`, `TiktokPixel.jsx`; policy §3, §5, §8 | Add template's "Exercising your right to opt-out of sale or sharing" paragraph incl. GPC honouring; add a footer "Your Privacy Choices" link. |
| 4 | **Last updated April 24, 2026** — five months and many shipped features ago (data-export, data-deletion, pixels, push). | `LAST_UPDATED` | Re-read against code, then bump. |
| 5 | **Arbitration (AAA, Riverside) + class waiver with no opt-out and no informal-resolution step.** Opt-out-less clauses are the first thing courts strike. | `app/terms/page.js` | Two routes. (a) Add a 30-day opt-out and 45-day informal step (template `terms-of-use` §11 Option A shape, keeping AAA). (b) Move to courts-only like PerkDayz — its ADR-005 found AAA consumer rules make the business pay most fees and mass arbitration is the bigger exposure. Do **not** use Option B (DecisionLayer AI arbitration). |

## Decide, then fix

- **Political-opinion inference.** Tracked representatives and poll votes can
  reveal political opinion — a GDPR special category and "sensitive" under some
  state laws. Say so, say you don't use it to infer anything, and make sure poll
  votes are not tied to identity in exports.
- **§1789.3 notice, accessibility statement, Shine the Light, NV/CO/CT/VA/TX
  notices:** all absent (all three also absent in the other two apps).
  Copy from `terms-of-use` §9–§10 and `privacy-policy-us`.
- **No indemnification gap:** present. Liability cap: present.
- **Strengths worth keeping:** self-serve export + deletion, 30-day deletion SLA,
  consent-gated analytics/ads/replay, 45-day CCPA response, refund policy page.

## Decisions needed

- **D-004** (opened in `DECISIONS-PENDING.md`): does "CivicWatch LLC" exist, and
  if not, whose name goes on the Terms.

## Update — patched after re-reading the code (2026-10-09)

**Corrections to the table above**

- **#2 — Anthropic is NOT used.** `@anthropic-ai/sdk` is in `package.json` but no
  file in `app/`, `lib/`, `components/` or `scripts/` imports it. Only Gemini
  (`app/api/analyze-rep`) is called. Resend and web-push **are** used.
- **#3 — a footer link already existed** ("Do Not Sell My Personal Information"
  → `/privacy#ccpa`) but the anchor had no target. Fixed.
- **GPC was not honoured anywhere in code**, so adding the sentence alone would
  have been untrue. Implemented in `lib/consent.js`.

**Patched (uncommitted)**

| Where | Change |
|---|---|
| `lib/consent.js` | `gpcOptOut()`; marketing consent forced off when the browser sends GPC |
| `app/privacy/page.js` | Resend + browser push services in §3; push-subscription data in §1; GPC sentence in §5; "Advertising cookies and sharing" paragraph and `id="ccpa"` in §8; date → October 9, 2026 |
| `app/terms/page.js` | New §17 California (Civ. Code 1789.3, no postal address), §18 Accessibility; Contact → §19; dates → October 9, 2026 |

**Left alone on purpose**

- "CivicWatch LLC" in Terms §1, §9, §12, §19 — waits on D-004.
- AAA arbitration / class waiver (#5) — your choice between adding an opt-out and
  moving to courts-only. Not opened as a decision yet.
- Political-opinion inference paragraph — needs you to confirm what the product
  does and does not infer.
- Postal address for the §1789.3 notice — same open question as PerkDayz D-009.

**Not verified:** pages were syntax-checked only. This repo's `node_modules` is
missing `typescript` (ESLint fails to start), and port 3000 is held by the
PerkDayz dev server, so I could not render them. Run `npm install`, then check
`/privacy#ccpa` and `/terms` in a browser.

