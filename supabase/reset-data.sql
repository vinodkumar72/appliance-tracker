-- ============================================================
-- CLEAN SLATE: wipes all synced app data.
-- Keeps: tables, policies, edge functions, and login accounts.
--
-- Order matters for a true reset:
--   1. Sign out (or close) the app on EVERY device first — an open,
--      signed-in app auto-syncs and will repopulate the tables within
--      seconds of this script running.
--   2. Run this script.
--   3. On each device: Company tab → Reset all data (or just sign in
--      fresh — with both sides empty there is nothing stale to push).
--   4. The first account to sign in and sync claims platform ownership.
--      Recreate your plans afterwards — the plan catalog is data too.
-- ============================================================

truncate table
  public.onboarding_requests,
  public.deletions,
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
