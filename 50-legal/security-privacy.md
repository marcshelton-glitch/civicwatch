---
doc: security-privacy
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-08-06
review_cadence: 90d
gantt_tasks: []
---

# Security & Privacy — civicwatch

## Data inventory

| Data | Sensitivity | Where stored | Encrypted at rest | Retention | Why collected |
|---|---|---|---|---|---|

**Collecting nothing is the strongest control available.** For each row, ask
whether the product genuinely needs it.

## Threat model

| Threat | Mitigated? | How |
|---|---|---|
| Database compromise | | |
| Leaked API key | | |
| Account takeover | | |
| XSS / injection | | |
| Insider / operator access | | |
| Device lost while signed in | | |
| Third-party breach | | |
| Data loss (no backup) | | |

Accepted risks belong here too, named and signed off — that's what makes them
accepted rather than overlooked.

## Secrets

| Secret | Where it lives | Rotation | Blast radius |
|---|---|---|---|

- [ ] Nothing secret is committed — verified with `git ls-files`
- [ ] `.gitignore` covers `.env*`, `client_secret_*.json`, `*.pem`, credential dumps
- [ ] Rotation procedure written in `60-ops/runbook.md`
- [ ] History checked — a secret ever committed is compromised even after deletion

## Auth
- **Provider:**
- **MFA:**
- **Session policy:**
- **Password/key derivation:** <name the algorithm and parameters>

## Backups
- **What:**
- **Frequency:**
- **Where:**
- **Restore tested on:** ← _an untested backup is not a backup_

## Incident response
1. Contain
2. Assess scope
3. Rotate affected credentials
4. Notify — check breach-notification deadlines in `compliance-checklist.md`
5. Post-mortem into `00-governance/decision-log.md`

## Decisions needed
- _(none)_
