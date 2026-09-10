-- Lets an invited user (signed in, but not yet linked to an app_users row)
-- find and claim the member record an admin created with their email.
-- For databases that already ran schema.sql before 2026-08-24.

drop policy if exists users_select on public.app_users;
create policy users_select on public.app_users for select
  using (
    auth_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    or public.is_platform_admin()
    or public.shares_org_with(id)
  );

drop policy if exists users_update on public.app_users;
create policy users_update on public.app_users for update
  using (
    auth_id = auth.uid()
    or (auth_id is null and lower(email) = lower(coalesce(auth.jwt()->>'email', '')))
    or public.is_platform_admin()
    or exists (select 1 from public.memberships m
               where m.user_id = public.app_users.id and public.can_manage_members(m.org_id))
  );
