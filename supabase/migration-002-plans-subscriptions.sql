-- Adds subscription plans and per-organization subscriptions.
-- For databases that already ran schema.sql before 2026-08-23.

create table if not exists public.plans (
  id text primary key,
  name text not null,
  yearly_price numeric not null default 0,
  max_properties integer,           -- null = unlimited
  trial_days integer not null default 0,
  created_at text,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id text primary key,
  org_id text not null unique references public.organizations (id) on delete cascade,
  plan_id text not null references public.plans (id) on delete cascade,
  status text not null check (status in ('trial','active')),
  started_at text,
  trial_ends_at text,
  current_period_end text,
  updated_at timestamptz not null default now()
);

alter table public.deletions drop constraint if exists deletions_entity_check;
alter table public.deletions add constraint deletions_entity_check
  check (entity in ('organization','user','membership','property','unit','appliance','log','schedule','plan','subscription'));

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

create policy plans_select on public.plans for select
  using (auth.uid() is not null);
create policy plans_insert on public.plans for insert
  with check (public.is_platform_admin());
create policy plans_update on public.plans for update
  using (public.is_platform_admin());
create policy plans_delete on public.plans for delete
  using (public.is_platform_admin());

create policy subscriptions_select on public.subscriptions for select
  using (public.is_platform_admin() or public.my_role(org_id) is not null);
create policy subscriptions_insert on public.subscriptions for insert
  with check (public.is_platform_admin());
create policy subscriptions_update on public.subscriptions for update
  using (public.is_platform_admin());
create policy subscriptions_delete on public.subscriptions for delete
  using (public.is_platform_admin());
