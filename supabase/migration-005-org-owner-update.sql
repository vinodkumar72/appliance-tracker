-- Lets a company's owner sync updates to their own organization row
-- (rename, address/phone from profile completion). Upserts are checked
-- against the INSERT policy even on the update path, so the insert rule
-- must also admit owners of the existing org. A truly new org still
-- requires the platform admin: a non-admin has no membership in an
-- unknown org id, so my_role() is null and the check fails.
-- Run in BOTH Supabase projects (dev and tester).

drop policy if exists orgs_insert on public.organizations;
create policy orgs_insert on public.organizations for insert
  with check (public.is_platform_admin() or public.my_role(id) = 'owner');
