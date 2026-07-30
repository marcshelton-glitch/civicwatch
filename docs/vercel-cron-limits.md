# Why the X-bot cron is not in vercel.json

**Do not add a sub-daily cron back to `vercel.json` while this project is on the Vercel
Hobby plan. It silently blocks every deployment.**

## What happened

Commit `f1c7d3c` (June 20, 2026) added:

```json
{ "path": "/api/alerts/x-bot", "schedule": "*/15 * * * *" }
```

Hobby accounts allow **at most one cron run per day**. Vercel rejects the deployment at
*config validation* — before a build is created:

```
Error: Hobby accounts are limited to daily cron jobs. This cron expression
(*/15 * * * *) would run more than once per day.
```

**Every git-triggered deployment from June 20 to July 30 was rejected this way.** Because
the rejection happens pre-build, nothing appears in the Vercel deployments list — not even
a failed entry. Production silently kept serving the June 20 build (`0fa8b52`) for six
weeks while commits piled up on `main`, including the July 16–17 feature work
(`59fa0e6`: Conflict Score, `/trades`, `/accountability`) and the July 30 Stripe fix.

The only deployments in that window were manual "Redeploy of …" actions, which reuse the
*previous* deployment's already-validated config and therefore never saw the bad cron.

**This cost six weeks of shipping for a bot that never ran** — `/api/alerts/x-bot` also
needs `X_BOT_*` credentials that were never set in Vercel.

## Restoring the X bot — three options

The route queries trades created in the **last 2 hours**, so a once-daily cron would miss
~22 hours of trades every day. Downgrading the schedule is worse than leaving it off:
it would look like it works while quietly dropping most disclosures. Pick one of:

1. **External scheduler (free, keeps 15-min cadence).** Run it from GitHub Actions —
   `.github/workflows/` already exists — hitting `/api/alerts/x-bot` on a `*/15` schedule
   with `CRON_SECRET` in the header. Nothing goes in `vercel.json`.
2. **Upgrade to Vercel Pro.** Unlocks arbitrary cron schedules; restore the original entry.
3. **Widen the query window** to 24h in `app/api/alerts/x-bot/route.js`, then a single
   daily Hobby cron is coherent. Lowest fidelity, but valid.

Whichever you choose, set the `X_BOT_*` env vars first — otherwise the bot fails silently
however it is scheduled.

## Rule of thumb

Anything added to `vercel.json` is validated before the build. A bad value there fails
**invisibly** — no build, no error in the deployments list. After editing `vercel.json`,
confirm a new deployment actually appears in Vercel, don't assume the push shipped.
