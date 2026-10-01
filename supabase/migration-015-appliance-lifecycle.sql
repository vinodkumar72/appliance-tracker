-- Migration 015: appliance lifecycle. Replacing or removing an appliance
-- retires the record (history preserved, hidden from main lists, excluded
-- from plan limits) instead of deleting it. 'replaced' records link to their
-- successor. Run in BOTH Supabase projects (dev and tester).

alter table public.appliances
  add column if not exists status text not null default 'active'
    check (status in ('active','replaced','removed'));
alter table public.appliances add column if not exists retired_at text;
alter table public.appliances add column if not exists retired_reason text;
alter table public.appliances add column if not exists replaced_by text;
