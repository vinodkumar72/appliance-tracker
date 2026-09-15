-- Seed the four pricing tiers (Free / Starter / Growth / Scale).
-- Run AFTER schema.sql (fresh install) or migration-009 (existing database).
-- Safe to re-run: existing rows with these ids are updated, not duplicated.
-- Requires either no RLS context issues (SQL Editor runs as postgres, which
-- bypasses RLS) — run it in the Supabase SQL Editor.

insert into public.plans
  (id, name, emoji, yearly_price, monthly_price, most_popular, max_units, min_units,
   max_appliances_per_property, trial_days, created_at, updated_at)
values
  ('plan-free-tier', 'Free Tier', '🎁',    0,  null, false, 3,    null, null, 0,  to_char(now(), 'YYYY-MM-DD'), now()),
  ('plan-starter',   'Starter',   '🌱',  180,    19, false, 10,   null, null, 14, to_char(now(), 'YYYY-MM-DD'), now()),
  ('plan-growth',    'Growth',    '🚀',  588,    59, true,  50,   null, null, 14, to_char(now(), 'YYYY-MM-DD'), now()),
  ('plan-scale',     'Scale',     '📈', 1188,   119, false, null, 100,  null, 14, to_char(now(), 'YYYY-MM-DD'), now())
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  yearly_price = excluded.yearly_price,
  monthly_price = excluded.monthly_price,
  most_popular = excluded.most_popular,
  max_units = excluded.max_units,
  min_units = excluded.min_units,
  trial_days = excluded.trial_days,
  updated_at = now();
