-- ============================================================
-- NUCLEAR REBUILD, step 1 of 2: tear down every app table.
-- Dropping the tables also drops ALL their policies, indexes, and
-- constraints. Helper functions are overwritten by schema.sql's
-- "create or replace" in step 2, so they need no dropping.
--
-- THE FULL PROCEDURE:
--   0. Close / sign out the app on EVERY device and browser tab.
--   1. Run THIS script.
--   2. Run ALL of schema.sql (the complete current blueprint —
--      no numbered migrations needed afterwards, it includes everything).
--   3. (Optional, recommended for a truly fresh start) delete test logins:
--        delete from auth.users where email <> 'YOUR-OWN-EMAIL';
--   4. Re-mirror the plans from Stripe (the sync-all backfill command).
--   5. ON EVERY DEVICE: Company tab -> Reset all data -> THEN sign in.
--      This matters more than ever: the rebuilt database has no memory
--      (no tombstones), so an unreset device would push its stale data
--      right back in. Your own browser first — first account to sync
--      claims platform ownership.
--   6. Onboard a test company and run the end-to-end flow.
-- ============================================================

drop table if exists public.contact_messages cascade;
drop table if exists public.onboarding_requests cascade;
drop table if exists public.deletions cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.plans cascade;
drop table if exists public.schedules cascade;
drop table if exists public.maintenance_logs cascade;
drop table if exists public.appliances cascade;
drop table if exists public.units cascade;
drop table if exists public.properties cascade;
drop table if exists public.memberships cascade;
drop table if exists public.organizations cascade;
drop table if exists public.app_users cascade;
