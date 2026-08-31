---
doc: launch-checklist
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-08-06
review_cadence: 30d
gantt_tasks: []
---

# Launch Checklist — civicwatch

**This is a gate, not a list.** Every box is checked before launch, or the
launch moves. An unchecked box overridden for schedule reasons must be recorded
in `00-governance/decision-log.md` with who accepted the risk.

## Legal & business
- [ ] Entity formed, EIN issued
- [ ] Business bank account
- [ ] Developer accounts under the correct entity (Apple, Google)
- [ ] Terms of Service published
- [ ] Privacy Policy published and accurate to what the app actually does
- [ ] Insurance if applicable
- [ ] Trademark search on the name

## Product
- [ ] Core flow works end to end on a clean account
- [ ] Error states and empty states handled
- [ ] Works on mobile
- [ ] Accessibility pass
- [ ] Data export / deletion path exists (often legally required)

## Technical
- [ ] 12-factor scorecard has no unaccepted `fail`
- [ ] Secrets out of the repo, verified with `git ls-files`
- [ ] Backups running **and a restore has actually been tested**
- [ ] Error monitoring reporting to somewhere you look
- [x] Uptime monitoring — Better Stack, civicwatch.app homepage monitor live (3m interval); /api/health endpoint monitor pending
- [ ] Rollback procedure tested, not just written
- [ ] Load sanity-checked against realistic launch traffic

## Payments
- [ ] Live mode verified with a real transaction
- [ ] Webhooks verified in live mode
- [ ] Refund path tested
- [ ] Failed-payment/dunning flow active
- [ ] Tax handling configured

## Analytics
- [ ] NorthStar metric instrumented and emitting
- [ ] Conversion tracking verified end to end **before any paid spend**
- [ ] UTM scheme documented

## Brand & content
- [ ] Site live, all pages complete
- [ ] Social profiles claimed and branded consistently
- [ ] Press kit ready
- [ ] Support email monitored

## Support
- [ ] Support channel live with a stated response SLA
- [ ] FAQ / docs cover the top 10 expected questions
- [ ] Escalation path for outages

## Post-launch, first 48h
- [ ] Someone is watching errors
- [ ] Someone is answering support
- [ ] Metrics reviewed at 24h and 48h
