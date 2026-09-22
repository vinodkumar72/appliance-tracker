-- Migration 013: THE upsert bug. The sync engine writes with
-- INSERT ... ON CONFLICT DO UPDATE, and Postgres requires proposed rows to
-- satisfy the UPDATE policy's WITH CHECK (= its USING, when none is given)
-- even on the insert path. properties_update's USING was
-- can_edit_property(id) — a lookup of the row's OWN id, which is false by
-- construction for a row that doesn't exist yet. Result: every brand-new
-- property upserted by a non-admin was rejected ("new row violates
-- row-level security policy"), while platform admins (is_platform_admin
-- short-circuit) and plain INSERTs (no UPDATE policy involvement) passed —
-- which is why it only ever bit invited company owners syncing.
--
-- Fix: an explicit WITH CHECK that validates new rows BY ORG (same rule as
-- insert), keeping the row-lookup for genuine updates of existing rows.
-- Run in BOTH Supabase projects (dev and tester).

drop policy if exists properties_update on public.properties;
create policy properties_update on public.properties for update
  using (public.can_edit_property(id))
  with check (
    public.is_platform_admin()
    or (public.my_role(org_id) in ('owner','admin','manager')
        and public.has_full_org_access(org_id))
    or public.can_edit_property(id)
  );
