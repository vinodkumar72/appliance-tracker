-- Migration 010: self-serve Stripe billing.
-- Plans remember their Stripe price ids so the create-checkout function can
-- start a Stripe Checkout session for the chosen billing interval.
-- Run in BOTH Supabase projects (dev and tester), then re-run the
-- stripe-catalog-sync backfill so the price ids get filled in.

alter table public.plans add column if not exists stripe_monthly_price_id text;
alter table public.plans add column if not exists stripe_yearly_price_id text;
