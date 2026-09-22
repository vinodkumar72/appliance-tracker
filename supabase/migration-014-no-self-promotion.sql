-- Migration 014: close the self-promotion hole. The UPDATE policy on
-- app_users allowed any user to update their own row — including flipping
-- is_platform_admin to true, which the sync would then persist. The new
-- WITH CHECK mirrors the INSERT rule: a row may carry the admin flag only if
-- the caller already is the platform admin, or no admin exists yet (the
-- legitimate first claim).
-- Run in BOTH Supabase projects (dev and tester).

drop policy if exists users_update on public.app_users;
create policy users_update on public.app_users for update
  using (
    auth_id = auth.uid()
    or (auth_id is null and lower(email) = lower(coalesce(auth.jwt()->>'email', '')))
    or public.is_platform_admin()
    or exists (select 1 from public.memberships m
               where m.user_id = public.app_users.id and public.can_manage_members(m.org_id))
  )
  with check (
    (not is_platform_admin)
    or public.is_platform_admin()
    or not public.platform_admin_exists()
  );
