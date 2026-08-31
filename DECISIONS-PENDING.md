# Decisions Pending — CivicWatch

Everything here is blocked on Marc. Agents may open, research, and recommend.
**Agents may never fill in `Decision:`.** Resolved entries move to
`00-governance/decision-log.md` with their rationale intact.

---

## D-002 · Move the loose business documents into the standard structure?
- **Status:** open
- **Raised:** 2026-08-11 by claude
- **Blocks:** nothing technically; blocks the repo being uniform with other projects
- **Cost of delay:** low, but it compounds — every week adds more loose files
- **Context:** the retrofit added the `00-` through `70-` structure alongside
  ~20 existing documents that are still at the repo root or in ad-hoc folders
  (`Media campaign/`, `Civicwatch Markdown files/`, `CivicWatch Downloaded Files/`).
  Several are `.docx`, which the standard treats as exports rather than sources.
  There are also **39 uncommitted changes** in the working tree right now, so a
  large move would tangle with whatever is in flight.
- **Options:**
  - **A — Commit what's in flight first, then move in one labelled commit.**
    Clean history, easy to review, easy to revert. Requires you to look at the
    39 changes first.
  - **B — Move now, on top of the uncommitted changes.** Faster, but the
    restructuring commit and your in-flight work become one indistinguishable
    blob.
  - **C — Leave existing docs where they are; use the new structure only for
    new work.** Zero risk now, permanent split-brain later — the thing this
    whole exercise exists to prevent.
- **Recommendation:** **A.** The 39 uncommitted changes need triage regardless,
  and doing it first makes the move reviewable in isolation.
- **Decision:** _(awaiting Marc)_

---

## D-001 · Which migration directory is authoritative — `migrations/` or `supabase/migrations/`?
- **Status:** open
- **Raised:** 2026-08-11 by claude
- **Blocks:** 12-factor XII; any future schema change
- **Cost of delay:** low day-to-day, **high the moment someone applies the wrong
  set to production** — and that risk is silent until it fires
- **Context:** both directories exist. `migrations/` holds ten numbered SQL
  files (`001_financial_disclosures.sql` … `010_…`). `supabase/migrations/`
  also exists. Nothing in the repo states which one the deployed database was
  actually built from. I could not determine this from the filesystem alone —
  it needs someone who knows the deploy history, or a diff against the live
  schema.
- **Options:**
  - **A — `migrations/` is canonical.** Delete or archive the Supabase copy,
    note it in the decision log.
  - **B — `supabase/migrations/` is canonical.** Standard Supabase CLI layout;
    better tooling support going forward.
  - **C — Diff both against the live schema first,** then decide with evidence.
- **Recommendation:** **C first, then B.** Guessing here risks the database.
  Once you know which matches production, consolidating on the Supabase CLI
  convention gives you `supabase db diff` and `supabase db push` for free.
- **Decision:** _(awaiting Marc)_
