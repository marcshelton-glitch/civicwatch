-- ─────────────────────────────────────────────────────────────────────────────
-- CivicWatch · Supabase Security Fixes
-- Run this entire file in the Supabase SQL Editor (civicwatch project)
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. public.users ──────────────────────────────────────────────────────────
-- Users can only read and update their own row. No one can insert or delete
-- via the API (rows are created by the auth trigger, not client code).

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: select own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── 2. public.tracked_reps ───────────────────────────────────────────────────
-- Each user can only see, add, and remove their own tracked reps.

ALTER TABLE public.tracked_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracked_reps: select own"
  ON public.tracked_reps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tracked_reps: insert own"
  ON public.tracked_reps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tracked_reps: delete own"
  ON public.tracked_reps FOR DELETE
  USING (auth.uid() = user_id);


-- ── 3. public.alerts ─────────────────────────────────────────────────────────
-- Users can only read their own alerts. Alerts are written server-side
-- (via service role), not by client code, so no INSERT policy needed here.

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts: select own"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "alerts: update own"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 4. public.poll_votes ─────────────────────────────────────────────────────
-- Users can see all poll votes (for aggregate display) but can only
-- insert their own votes, and cannot update or delete any vote.

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_votes: select all"
  ON public.poll_votes FOR SELECT
  USING (true);

CREATE POLICY "poll_votes: insert own"
  ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── 5. public.legiscan_cache ─────────────────────────────────────────────────
-- This table is only ever read/written by the server via the service role key.
-- No client should access it at all. Lock it down completely.

ALTER TABLE public.legiscan_cache ENABLE ROW LEVEL SECURITY;
-- No policies = no access for any client. Service role bypasses RLS automatically.


-- ── 6. Fix mutable search path on update_legiscan_* function ─────────────────
-- The warning "Function Search Path Mutable" means the function doesn't pin
-- its search_path, allowing an attacker to shadow pg_catalog functions.
-- Fix: set search_path = '' on the function.
--
-- NOTE: Check the exact function signature in Supabase Dashboard >
-- Database > Functions, then use the matching signature below.

ALTER FUNCTION public.update_legiscan_cache()
  SET search_path = '';

-- If it takes arguments, use the full signature instead, e.g.:
-- ALTER FUNCTION public.update_legiscan_cache(text, jsonb)
--   SET search_path = '';


-- ─────────────────────────────────────────────────────────────────────────────
-- After running: go to Security Advisor and hit Refresh.
-- All 4 RLS errors and the search_path warning should be cleared.
-- ─────────────────────────────────────────────────────────────────────────────
