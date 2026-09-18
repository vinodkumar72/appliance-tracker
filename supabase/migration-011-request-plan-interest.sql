-- Migration 011: prospects can indicate which plan they're interested in on
-- the public request-invite form; the platform owner sees it in the inbox and
-- it pre-selects the starting plan during onboarding.
-- Run in BOTH Supabase projects (dev and tester).

alter table public.onboarding_requests add column if not exists plan_id text;
