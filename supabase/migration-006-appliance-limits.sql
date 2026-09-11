-- Adds the per-property appliance limit to plans.
-- Run in BOTH Supabase projects (dev and tester).
alter table public.plans add column if not exists max_appliances_per_property integer;
