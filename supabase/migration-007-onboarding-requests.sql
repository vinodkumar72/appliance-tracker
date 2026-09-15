-- Invite requests from prospective customers (submitted from the sign-in
-- screen, no account needed). Only the platform owner can read or manage them.
-- Run in BOTH Supabase projects (dev and tester).

create table if not exists public.onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'pending' check (status in ('pending','onboarded','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.onboarding_requests enable row level security;

-- Anyone (even unauthenticated visitors) may submit a request, with basic
-- size limits to blunt abuse.
create policy requests_insert on public.onboarding_requests for insert
  to anon, authenticated
  with check (
    char_length(company_name) between 1 and 200
    and char_length(contact_name) between 1 and 200
    and char_length(email) between 3 and 320
    and (phone is null or char_length(phone) <= 50)
    and (message is null or char_length(message) <= 2000)
    and status = 'pending'
  );

create policy requests_select on public.onboarding_requests for select
  using (public.is_platform_admin());
create policy requests_update on public.onboarding_requests for update
  using (public.is_platform_admin());
create policy requests_delete on public.onboarding_requests for delete
  using (public.is_platform_admin());
