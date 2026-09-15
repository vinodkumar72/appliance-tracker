-- Lets the public pricing page read the plan catalog without an account.
-- Plans contain no customer data — only your published tiers.
-- Run in BOTH Supabase projects (dev and tester).
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select
  to anon, authenticated
  using (true);
