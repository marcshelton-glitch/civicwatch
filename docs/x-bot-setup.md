# @CivicWatchAlerts X Bot — Setup Guide

The bot lives at `app/api/alerts/x-bot/route.js` and is invoked by Vercel cron every 15 minutes. It queries Supabase for trades filed in the last 2 hours that haven't been posted yet, then tweets each one via Twitter API v2.

---

## 1. Create the Twitter Developer App

1. Go to [developer.twitter.com](https://developer.twitter.com) and log in as **@CivicWatchAlerts**.
2. Create a new Project → App. Name it `CivicWatchAlerts`.
3. In **App Settings → User authentication settings**, enable OAuth 1.0a:
   - App permissions: **Read and Write**
   - Type of App: **Web App, Automated App or Bot**
   - Callback URI: `https://civicwatch.app/auth/callback` (placeholder — not used by bot)
   - Website URL: `https://civicwatch.app`

---

## 2. Required OAuth Scopes

When generating tokens, ensure the app has:

| Scope | Why |
|---|---|
| `tweet.write` | Post new tweets |
| `tweet.read` | Read own tweet metadata |
| `users.read` | Identify the authed user |

---

## 3. Get Your Credentials

From the **Keys and Tokens** tab of your app:

| Credential | Where to find it |
|---|---|
| API Key | "Consumer Keys" → API Key |
| API Key Secret | "Consumer Keys" → API Key Secret |
| Access Token | "Authentication Tokens" → Access Token |
| Access Token Secret | "Authentication Tokens" → Access Token Secret |

> **Important:** Generate the Access Token and Secret while logged in as **@CivicWatchAlerts** (not your personal account). These tokens represent the bot account.

---

## 4. Add Env Vars in Vercel

In [vercel.com](https://vercel.com) → civicwatch project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `X_BOT_CLIENT_ID` | API Key (Consumer Key) |
| `X_BOT_CLIENT_SECRET` | API Key Secret (Consumer Secret) |
| `X_BOT_ACCESS_TOKEN` | Access Token |
| `X_BOT_ACCESS_TOKEN_SECRET` | Access Token Secret |

The bot also uses `CRON_SECRET` (already set) to authenticate the Vercel cron request, and `CONGRESS_API_KEY` (already set) for best-effort party lookups.

---

## 5. Run the Database Migration

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- supabase/migrations/20260620000001_create_x_bot_posts.sql
CREATE TABLE x_bot_posts (
  id        BIGSERIAL PRIMARY KEY,
  trade_id  TEXT        NOT NULL UNIQUE,
  tweet_id  TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX x_bot_posts_posted_at ON x_bot_posts (posted_at DESC);
```

---

## 6. Test the Endpoint

```bash
curl -X POST https://civicwatch.app/api/alerts/x-bot \
  -H "Authorization: Bearer $CRON_SECRET"
```

The response will be:
```json
{ "ok": true, "posted": 2, "skipped": 0, "errors": [] }
```

---

## Tweet Format

```
🚨 STOCK ACT DISCLOSURE

Nancy Pelosi (D-CA) · HOUSE
SELL AAPL · $1,001–$15,000
Filed: Jun 15

https://civicwatch.app/rep/P000197

#STOCKAct #CongressionalTrading #CivicWatch
```

---

## Required Env Vars Summary

| Variable | Purpose |
|---|---|
| `X_BOT_CLIENT_ID` | Twitter consumer key |
| `X_BOT_CLIENT_SECRET` | Twitter consumer secret |
| `X_BOT_ACCESS_TOKEN` | @CivicWatchAlerts access token |
| `X_BOT_ACCESS_TOKEN_SECRET` | @CivicWatchAlerts access token secret |
| `CRON_SECRET` | Already set — authenticates cron calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Already set — reads/writes x_bot_posts |
| `CONGRESS_API_KEY` | Already set — party lookups (best-effort) |
