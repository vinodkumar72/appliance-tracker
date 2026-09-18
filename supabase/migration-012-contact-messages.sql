-- Migration 012: public "Contact us" messages.
-- Anyone can send one from the website; only the platform owner can read or
-- dismiss them (they appear in the Company-tab inbox next to onboarding
-- requests). Run in BOTH Supabase projects (dev and tester).

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  status text not null default 'pending' check (status in ('pending','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (even signed out) may send a message.
create policy contact_insert on public.contact_messages
  for insert with check (true);

-- Only the platform owner sees or updates them.
create policy contact_select on public.contact_messages
  for select using (is_platform_admin());
create policy contact_update on public.contact_messages
  for update using (is_platform_admin());
