---
doc: risk-register
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-08-06
review_cadence: 30d
gantt_tasks: []
---

# Risk Register — civicwatch

Severity is `likelihood × impact`. **Anything reaching `high` or `critical`
must be escalated to `DECISIONS-PENDING.md`** — that's the trigger the
autonomous manager uses.

| ID | Risk | Severity | Likelihood | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R-01 | | | | | | open |

## Prompts — risks that are easy to miss

- **Legal entity gates the launch.** App Store 5.1.1(ix) and Google Play both
  push apps handling sensitive data toward an organization account. D-U-N-S
  takes ~28 days. This is a schedule risk, not a paperwork risk.
- **Single point of data loss.** Where does the only copy of something
  irreplaceable live right now?
- **Key-person risk.** If you're unavailable for a month, what stops?
- **Vendor concentration.** What happens if Stripe, Vercel, Supabase, or Clerk
  changes pricing or terms?
- **Secret exposure.** What is the blast radius of one leaked key, and how fast
  can you rotate it?
- **Regulatory reclassification.** Could this product be treated as a regulated
  category (health, financial advice, political) you didn't plan for?
