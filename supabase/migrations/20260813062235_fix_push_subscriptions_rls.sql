-- 009 — Remove world-writable RLS policy on push_subscriptions (P0 security)
-- The "Service role bypass" policy was granted to `public`, not `service_role`,
-- with USING(true) WITH CHECK(true) for ALL commands — any visitor holding the
-- shipped anon key could read/write/delete every subscriber's push endpoint
-- and encryption keys. Two correct policies already exist (service_role_all,
-- Users can manage own subscriptions), so dropping this is a pure fix.
drop policy if exists "Service role bypass" on public.push_subscriptions;