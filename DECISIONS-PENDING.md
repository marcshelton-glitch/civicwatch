# Decisions Pending — CivicWatch

Everything here is blocked on Marc. Agents may open, research, and recommend.
**Agents may never fill in `Decision:`.** Resolved entries move to
`00-governance/decision-log.md` with their rationale intact.

---

## D-005 · Cache AI reports per representative, and is the Gemini key on a billed project?
- **Status:** open
- **Raised:** 2026-10-09 by Claude
- **Blocks:** nothing. The key check itself is scheduled as Gantt #53 (no decision needed to do it); the cache (option A) is not yet a task and waits on this decision.
- **Cost of delay:** none today. Cost grows linearly with views because `app/api/analyze-rep/route.js` regenerates an identical report per request (`Cache-Control: private, no-store`). The more urgent risk is reliability: if `GOOGLE_AI_API_KEY` is on a free-tier project, the whole app shares one ~1,500 requests/day pool and paying Pro users would see "AI analysis failed" once it is spent.
- **Options:**
  - **A — Cache in Supabase keyed on a hash of the sanitized payload (24h TTL), and confirm the key is on a billed project.** Roughly half a day. Caps AI spend at ~$50/mo regardless of users and makes self-hosting permanently unnecessary. Key on the payload hash, not the rep name: the route accepts client-supplied trades and votes, so a name key would let fabricated data be served to other users.
  - **B — Leave as is.** The per-user 50k tokens/day cap already bounds a Pro user at ~$2/mo. Revisit once `token_usage` shows real volume.
  - **C — Self-host a model.** Not recommended; needs ~$500/mo of sustained spend first. See `~/Projects/projects-dashboard/inference-hosting-analysis.md`.
- **Recommendation:** Check the billing status of the key before 10-23 (five minutes in Google AI Studio), then do A in the two weeks after launch when real token counts exist.
- **Decision:** _(awaiting Marc)_

## D-004 · The live Terms name "CivicWatch LLC" — does it exist, and if not, whose name goes on them?
- **Status:** open
- **Raised:** 2026-10-09 by Claude
- **Blocks:** nothing yet (affects the contract party named in `app/terms/page.js` and any chargeback / dispute)
- **Cost of delay:** every day the Terms name an entity that may not be registered is a misstatement to paying customers; it also weakens the liability protection the LLC is supposed to provide. Launch push is 2026-10-23.
- **Options:**
  - **A — LLC exists.** Confirm on bizfileOnline.sos.ca.gov, record the filing in `50-legal/business-documentation.md`, no change to Terms.
  - **B — No LLC yet: name yourself.** Change Terms and Privacy to "Marc Shelton, doing business as CivicWatch" (CA needs a county Fictitious Business Name statement; fee plus newspaper notice, verify). $ low, truthful today, swap when an LLC forms.
  - **C — Form the LLC now.** About $70 + $800/yr minimum franchise tax (verify).
- **Recommendation:** A if it exists; otherwise B — it is accurate immediately and costs far less than C while revenue is zero.
- **Decision:** _(awaiting Marc)_

Resolved decisions: see `00-governance/decision-log.md` (ADR-002 D-002,
ADR-003 D-001, ADR-004 D-003).
