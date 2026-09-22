-- ============================================================
-- SELECTIVE RESET: wipes all companies and their data, but KEEPS
--   - the pricing plans (Stripe-mirrored — no backfill needed after)
--   - the platform owner (both the app_users row with its admin flag
--     AND the login), so no re-claiming ownership
-- Deletes every other login too, so test emails can be re-invited.
--
-- Every wiped record is TOMBSTONED first, so any device that still holds a
-- local copy deletes it automatically on its next sync (no more devices
-- re-uploading ghost data after a reset). Unsynced work on devices is
-- discarded by that cleanup — the reset makes the server the truth.
-- ============================================================

delete from public.deletions;

insert into public.deletions (entity, id)
          select 'schedule', id from public.schedules
union all select 'log', id from public.maintenance_logs
union all select 'appliance', id from public.appliances
union all select 'unit', id from public.units
union all select 'property', id from public.properties
union all select 'subscription', id from public.subscriptions
union all select 'membership', id from public.memberships
union all select 'organization', id from public.organizations
union all select 'user', id from public.app_users
          where not (is_platform_admin and auth_id is not null);
-- (plans are kept, so no plan tombstones)

delete from public.subscriptions;
delete from public.schedules;
delete from public.maintenance_logs;
delete from public.appliances;
delete from public.units;
delete from public.properties;
delete from public.memberships;
delete from public.organizations;
delete from public.onboarding_requests;
delete from public.contact_messages;

-- Keep only the platform owner's profile row (linked + flagged).
delete from public.app_users
where not (is_platform_admin and auth_id is not null);

-- Keep only logins that still have a profile row (i.e. the owner);
-- all invited/test logins go, so their emails can be re-invited fresh.
delete from auth.users
where id not in (select auth_id from public.app_users where auth_id is not null);
