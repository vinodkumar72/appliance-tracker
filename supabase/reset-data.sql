-- Wipes all synced app data (keeps the tables, policies, and your auth account).
-- Run in Supabase SQL Editor when you want a clean slate before re-syncing.
truncate table
  public.deletions,
  public.schedules,
  public.maintenance_logs,
  public.appliances,
  public.units,
  public.properties,
  public.memberships,
  public.organizations,
  public.app_users
cascade;
