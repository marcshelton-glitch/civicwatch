# CivicWatch Pre-Launch Checklist
> Last updated: May 19, 2026

## 💳 Payments & Subscriptions
- [ ] Test the full Go Pro → Stripe checkout → success redirect flow end-to-end *(manual)*
- [ ] Test what happens when a card is declined *(manual)*
- [x] Clear "what you get with Pro" explanation — SettingsPanel CTA updated with 5-bullet list
- [ ] Free users hit paywall at the right moment
- [x] Way to cancel subscription from within the app — "Manage Billing & Subscription" links to /api/billing-portal in 3 places

## ⚖️ Legal
- [x] Terms of Service page — linked in footer
- [x] Privacy Policy — linked in footer and on signup
- [x] Data deletion page — linked in footer
- [x] Cookie consent banner (GDPR) — added in prior session
- [x] Disclaimer that congressional data is public record — added to About page
- [x] Refund policy — added to Terms §4 (7-day window for new subscribers)

## 🔐 Auth & Security
- [ ] Sign up → email verification → onboarding flow smooth end-to-end *(manual)*
- [ ] Password reset works and delivers email *(manual)*
- [x] New user onboarding guidance — 3-step modal fires on first visit (Welcome → Find Reps → Track a Rep)
- [ ] Pro-only features gated server-side (not just hidden in UI)

## 📱 Mobile
- [ ] Walk through entire app on real iPhone *(manual)*
- [ ] District map usable on mobile
- [ ] Leaderboard readable on small screens
- [ ] Navigation doesn't overflow on small screens

## 🔍 SEO & Discoverability
- [x] Page titles and meta descriptions on every route (4 pages fixed, OG fields added)
- [x] OG image for link sharing — opengraph-image.js updated with correct tagline
- [x] sitemap.xml created (all 7 public routes)
- [x] robots.txt created (allows all crawlers, points to sitemap)
- [x] Favicon shows correctly — app/favicon.ico exists and registered in layout.js
- [x] Google Search Console verified via HTML tag ✅

## 📊 Analytics & Monitoring
- [x] Analytics installed — GA4 via @next/third-parties added to layout.js; needs NEXT_PUBLIC_GA_MEASUREMENT_ID set in Vercel
- [x] Error monitoring — Sentry wizard ran, config files created, deploy pending
- [x] Uptime monitoring — Better Stack active, civicwatch.app showing green ✅
- [x] Vercel Analytics + Speed Insights added to layout.js

## 📧 Email
- [ ] Welcome email on signup works *(manual)*
- [ ] Subscription confirmation email works *(manual)*
- [ ] Cancellation notice email works *(manual)*
- [ ] Email alerts for tracked reps send correctly *(manual)*
- [ ] "From" email is a real domain address (not Clerk default)
- [ ] Email list / waitlist for launch announcement

## 🗺️ Content & Copy
- [x] About page tells the story clearly — existing page is solid (mission, STOCK Act, data sources, stats)
- [x] Press/media page — created app/press/page.js with press contact, key facts, about blurbs, kit placeholder; linked from footer
- [x] Footer has all right links: About, Privacy, Terms, Contact, Data Deletion — Contact mailto added
- [x] No placeholder text — "Location TBD" replaced with "Location not listed"
- [x] Data attribution — already present (Congress.gov, House Clerk, Senate, LegiScan)

## ⚡ Performance
- [ ] Lighthouse audit — 80+ Performance, 100 Accessibility *(manual)*
- [ ] Loads acceptably on slow 4G *(manual)*
- [x] Images use Next.js Image component — all 12 raw img tags replaced

## 🚨 Stress / Edge Cases
- [x] Supabase down → fixed try/catch in public-feed, networth, onboarding routes
- [x] Lapsed Stripe payment → webhook already handles subscription.deleted, paused, and updated (non-active status) → sets isPro: false
- [x] Search for non-existent rep → "No results found for '…'" already in place
- [x] Leaderboard DB query fails → graceful error already in place

---
## ✅ Already Fixed (prior sessions)
- [x] Rep photos loading via server-side proxy
- [x] Auth middleware not blocking public routes
- [x] Net worth spinner / empty state
- [x] Leaderboard bioguide_ids (photos now show)
- [x] Privacy & Data Deletion pages unstyled
- [x] Net worth chart crash on null data
- [x] California district map projection bug
- [x] Party colors wrong / Democrat never applied
- [x] Three.js Capitol obscuring hero text
- [x] STRIPE_PRO_PRICE_ID updated in Vercel
- [x] Clerk v7 deprecated redirect props
- [x] Leaderboard party filter tabs broken
- [x] Stripe webhook cancellation fails above 100 users
- [x] Cookie consent banner (GDPR) added
- [x] Server-side Pro gating for net worth + trades APIs
- [x] Google Search Console verified (HTML tag method)
- [x] Sentry error monitoring configured (wizard ran May 19)
- [x] Vercel Analytics + Speed Insights installed
