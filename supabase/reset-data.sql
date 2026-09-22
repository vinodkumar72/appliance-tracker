-- ============================================================
-- CLEAN SLATE: wipes all synced app data.
-- Keeps: tables, policies, edge functions, and login accounts.
--
-- Every wiped record is TOMBSTONED first, so any device that still holds a
-- local copy deletes it automatically on its next sync (no more devices
-- re-uploading ghost data after a reset). Unsynced work on devices is
-- discarded by that cleanup — the reset makes the server the truth.
--
-- Afterwards: sign in (first account to sync claims platform ownership) and
-- re-run the Stripe catalog backfill to restore plans.
-- ============================================================

truncate table public.deletions;

insert into public.deletions (entity, id)
          select 'schedule', id from public.schedules
union all select 'log', id from public.maintenance_logs
union all select 'appliance', id from public.appliances
union all select 'unit', id from public.units
union all select 'property', id from public.properties
union all select 'subscription', id from public.subscriptions
union all select 'plan', id from public.plans
union all select 'membership', id from public.memberships
union all select 'organization', id from public.organizations
union all select 'user', id from public.app_users;

truncate table
  public.onboarding_requests,
  public.contact_messages,
  public.subscriptions,
  public.plans,
  public.schedules,
  public.maintenance_logs,
  public.appliances,
  public.units,
  public.properties,
  public.memberships,
  public.organizations,
  public.app_users
cascade;

-- OPTIONAL: also delete every login account (email/password credentials).
-- Uncomment ONLY if you want people to have to sign up again from scratch.
-- delete from auth.users;
