---
doc: compliance-checklist
project: civicwatch
status: reconciled
owner: Marc Shelton
last_reviewed: 2026-09-20
review_cadence: 90d
gantt_tasks: []
---

# Compliance Checklist — civicwatch

**Not legal advice.** This tracks what applies and whether you've addressed it,
so a professional review is cheap and targeted rather than open-ended.

Reconciled against the shipped code on 2026-09-20. A box is ticked only where
the artifact was verified in the repo. Partial work is left unticked with the
specific gap named, so nothing reads as done when it isn't.

civicwatch is a **web-only Next.js app** — no iOS or Android build, no mobile
dependencies in `package.json`. That makes the whole app-store section N/A.

## Applicability

| Regime | Applies? | Why / why not | Status |
|---|---|---|---|
| GDPR | Yes | Open to EU visitors; policy §9 addresses it | Addressed — consent now gates trackers |
| CCPA/CPRA | Yes | CA residents; policy §8 + §13 | Addressed in policy |
| COPPA | **Confirm** | Policy §11 exists; needs a stated 13+ gate at sign-up | Open |
| HIPAA | No | No PHI, not a covered entity or BA | N/A |
| PCI-DSS | Yes — SAQ-A | Stripe handles cards; no card data touches our servers | Addressed |
| CAN-SPAM | Yes | `app/api/send-alerts/route.js` sends mail | Needs unsubscribe audit |
| ADA / WCAG | Yes | Public-facing site | Pass done 2026-09-20 — see below |
| App Store guidelines | No | Web-only, no iOS build | N/A |
| Google Play policies | No | Web-only, no Android build | N/A |
| Export (encryption) | No | No app-store submission to declare against | N/A |
| State registration | **Confirm** | Depends on nexus — Marc to answer | Open |

## Required artifacts

- [x] **Privacy Policy** — shipped and now accurate. §3 discloses every
      processor (Clerk, Supabase, Stripe, Vercel, Google/Gemini, Sentry) and
      separates analytics (Vercel Analytics, Speed Insights, Google Analytics,
      Sentry Session Replay) from advertising (Meta Pixel, TikTok Pixel).
      §5 now describes the three cookie categories and states that optional
      ones do not run before consent. Fixed 2026-09-20.
- [x] **Terms of Service** — shipped, `app/terms/page.js`, 329 lines
- [x] **Cookie consent** — rebuilt 2026-09-20. Equal-weight "Reject optional"
      and "Accept all" (same size, weight and padding — an under-weighted
      reject invalidates the consent), Escape resolves to reject, focus moves
      to the banner, visible focus rings, 44px targets. Consent now actually
      gates the trackers via `lib/consent.js`; previously nothing read it.
      Legacy `'1'` records are not inherited, so past "accepts" re-prompt.
- **DPA available for business customers** — **N/A.** Marc confirmed
      2026-09-20 that `pro` is a consumer tier, not B2B. CivicWatch is the
      controller for its own users; there are no business customers acting as
      controllers who would need a DPA from us. Revisit only if a team,
      organisation or newsroom tier is ever sold.
- [x] **Data deletion request path** — shipped, `app/data-deletion/page.js`
      (request form + `mailto:` fallback)
- [x] **Data export path** — built 2026-09-20. `/data-export` plus
      `GET /api/data-export`: the signed-in user downloads a JSON file of
      everything keyed to their account, no request or human step. Covers all
      nine user-keyed tables (verified against the migrations) plus their Clerk
      account record. Rate limited to three per hour. Deliberately excluded and
      stated inside the file: push encryption keys (credentials), internal
      refund notes and reviewer names (other people's data), and congressional
      data (public record).
- **Subprocessor list** — **N/A as a standalone artifact.** A dedicated,
      dated list with change notifications is a B2B contractual expectation,
      and `pro` is consumer (confirmed 2026-09-20). The consumer-facing
      obligation is disclosure, which policy §3 meets: every processor is
      named with its purpose, grouped into necessary, analytics and
      advertising. Keep §3 current when a provider is added or dropped.

## App store specifics

**N/A — web-only.** No iOS or Android build exists. Revisit this section only
if civicwatch ships a native app; both stores would then require in-app account
deletion and an accurate data-safety label.

- ~~Data safety / privacy nutrition label matches reality~~ — N/A
- ~~Account deletion **inside the app**~~ — N/A
- ~~Export compliance answered correctly~~ — N/A
- ~~Sensitive-category declarations reviewed~~ — N/A
- ~~Entity-vs-individual submission requirement~~ — N/A

## Sector-specific

civicwatch publishes **congressional trading and accountability data** (routes:
`trades`, `accountability`, `leaderboard`, `constitution`). That is political
*and* financial content, which carries two live consequences:

- **Ad platforms may classify it as political.** Already anticipated — task #47
  is specifically "record whether Meta flags it as political."
- **Financial-data framing matters.** Presenting public disclosure data is fine;
  presenting it as investment guidance is not. Keep the framing descriptive and
  keep a disclaimer visible on `trades` and `leaderboard`.

## Professional review

- **Reviewed by:** _(none yet)_
- **Date:**
- **Open questions for counsel:**
  - Does the `pro` tier create business customers who will demand a DPA?
  - Is the trades/leaderboard framing clear of investment-advice exposure?

## Decisions needed

1. ~~Add Sentry to the privacy policy~~ — **done 2026-09-20.** The audit found
   five more undisclosed trackers alongside Sentry: Google Analytics, Meta
   Pixel, TikTok Pixel, Vercel Analytics and Vercel Speed Insights. All six
   now disclosed.
2. ~~Add a reject option to the cookie banner~~ — **done 2026-09-20**, and the
   banner now gates the trackers rather than just recording a click.
3. ~~Build a data export path~~ — **done 2026-09-20**, and built self-serve
   rather than as a request form, since the data model supported it. Privacy
   policy §7 was updated to match: it previously told people to email us for
   access and export, which is no longer how it works.
4. ~~Wire a "Cookie choices" link in the footer~~ — **done 2026-09-20.**
   `components/CookieChoicesLink.jsx` sits in the footer of the seven pages
   that have footer link lists, including every legal page. It is a `<button>`
   rather than a link because it opens the banner rather than navigating.
   **Not covered:** `/press`, `/about` and `/leaderboard` have no footer link
   list at all, so there was nowhere idiomatic to put it. Add one if you ever
   give those pages a proper footer.
5. ~~Is `pro` B2B?~~ — **answered 2026-09-20: no, it is a consumer tier.**
   DPA and standalone subprocessor list are both N/A as a result. The one
   maintenance duty that survives: when you add or drop a provider, update
   privacy policy §3, and gate it in `lib/consent.js` if it is non-essential.
**Required artifacts are now complete: 5 shipped, 2 N/A, 0 outstanding.**
Three applicability rows are still unresolved — none of them block a launch,
but they are the honest remainder:

6. **State registration nexus** — which states, if any? Marc to answer.
7. **COPPA** — policy §11 exists, but there is no stated 13+ gate at sign-up.
   Either add an age affirmation to the sign-up flow or confirm the service is
   not directed at under-13s and record that reasoning here.
8. ~~ADA / WCAG~~ — **pass done 2026-09-20, before the launch post.** Fixed:
   a global `:focus-visible` ring (several components set `outline:none`
   inline, leaving keyboard users with no indicator at all), a skip link,
   a `prefers-reduced-motion` block, accessible names on the three icon-only
   controls, 44px targets on the map-zoom and settings-close buttons,
   keyboard access for four click handlers that were `div onClick`, a label
   on the rep search box, and two contrast failures (`Saved ✓` at 3.39:1 and
   the Terms section numbers at 2.74:1, now 7.98 and 5.92).

   **This was a static pass, not a certified audit.** Not covered: screen
   reader testing, tab-order-in-practice, the map's SVG interactions, any
   signed-in flow, and the emoji used as nav icons (🏆 🔎 📊 — they sit
   beside real text labels so they read as noise rather than as failures).
   A real AA claim needs a manual pass with VoiceOver.
