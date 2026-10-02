-- Migration 016: self-serve signup. Companies created by the create-company
-- edge function (no platform-owner involvement) are marked so the platform
-- owner can tell signups from onboardings at a glance.
-- Run in BOTH Supabase projects (dev and tester).

alter table public.organizations
  add column if not exists self_served boolean not null default false;
