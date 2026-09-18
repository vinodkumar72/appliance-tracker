-- ============================================================
-- SELECTIVE RESET: wipes all companies and their data, but KEEPS
--   - the pricing plans (Stripe-mirrored — no backfill needed after)
--   - the platform owner (both the app_users row with its admin flag
--     AND the login), so no re-claiming ownership
-- Deletes every other login too, so test emails can be re-invited.
--
-- Order matters:
--   1. Close / sign out the app on EVERY device first — an open app
--      auto-syncs and pushes its old data right back (the platform
--      owner's own device especially: admins pass every permission check).
--   2. Run this script in the SQL Editor.
--   3. On each device (including yours): Company tab -> Reset all data,
--      then sign in. The owner's flag and the plans are already on the
--      server, so everything just pulls back in.
-- ============================================================

delete from public.subscriptions;
delete from public.schedules;
delete from public.maintenance_logs;
delete from public.appliances;
delete from public.units;
delete from public.properties;
delete from public.memberships;
delete from public.organizations;
delete from public.onboarding_requests;
delete from public.deletions;

-- Keep only the platform owner's profile row (linked + flagged).
delete from public.app_users
where not (is_platform_admin and auth_id is not null);

-- Keep only logins that still have a profile row (i.e. the owner);
-- all invited/test logins go, so their emails can be re-invited fresh.
delete from auth.users
where id not in (select auth_id from public.app_users where auth_id is not null);
