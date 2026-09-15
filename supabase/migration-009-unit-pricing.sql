-- Migration 009: unit-based pricing tiers.
-- Plans are now priced per UNIT (a property with no units counts as 1 unit)
-- and carry monthly pricing + display fields for the public pricing table.
-- Run in BOTH Supabase projects (dev and tester).

alter table public.plans add column if not exists emoji text;
alter table public.plans add column if not exists monthly_price numeric;
alter table public.plans add column if not exists most_popular boolean not null default false;
alter table public.plans add column if not exists max_units integer;
alter table public.plans add column if not exists min_units integer;

-- Carry the old property limit over as the unit limit so existing plans keep
-- enforcing something sensible until you edit them.
update public.plans
set max_units = max_properties
where max_units is null and max_properties is not null;
