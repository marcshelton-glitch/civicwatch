
-- 1. senate_trades — public reference data
ALTER TABLE public.senate_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.senate_trades
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read" ON public.senate_trades
  FOR SELECT TO anon, authenticated USING (true);

-- 2. user_tracked_reps — private user data
ALTER TABLE public.user_tracked_reps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.user_tracked_reps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. sent_alerts — private user data
ALTER TABLE public.sent_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.sent_alerts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. user_preferences — private user data
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.user_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. opensecrets_net_worth — public reference data
ALTER TABLE public.opensecrets_net_worth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.opensecrets_net_worth
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read" ON public.opensecrets_net_worth
  FOR SELECT TO anon, authenticated USING (true);
