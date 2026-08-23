-- ============================================================
-- Appliance Tracker — Supabase schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run on a fresh project. Tables mirror src/lib/types.ts.
-- ============================================================

-- ---------- Tables ----------

create table public.app_users (
  id text primary key,
  auth_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text not null default '',
  is_platform_admin boolean not null default false,
  created_at text,
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id text primary key,
  name text not null,
  created_at text,
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id text primary key,
  org_id text not null references public.organizations (id) on delete cascade,
  user_id text not null references public.app_users (id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','technician','viewer','investor')),
  property_ids text[],  -- null = all properties; array = property-level grant
  unit_ids text[],      -- unit-level grants (condo owners etc.)
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table public.properties (
  id text primary key,
  org_id text not null references public.organizations (id) on delete cascade,
  name text not null,
  address text not null,
  notes text,
  owner_name text,
  owner_phone text,
  owner_email text,
  owner_mailing_address text,
  created_at text,
  updated_at timestamptz not null default now()
);

create table public.units (
  id text primary key,
  property_id text not null references public.properties (id) on delete cascade,
  name text not null,
  notes text,
  owner_name text,
  owner_phone text,
  owner_email text,
  owner_mailing_address text,
  created_at text,
  updated_at timestamptz not null default now()
);

create table public.appliances (
  id text primary key,
  property_id text not null references public.properties (id) on delete cascade,
  unit_id text references public.units (id) on delete set null,
  name text not null,
  type text not null check (type in ('refrigerator','hvac','water-heater','dishwasher','washer','dryer','oven-range','microwave','garbage-disposal','other')),
  brand text,
  model text,
  serial_number text,
  purchase_date text,
  warranty_expiry text,
  warranty_provider text,
  notes text,
  created_at text,
  updated_at timestamptz not null default now()
);

create table public.maintenance_logs (
  id text primary key,
  appliance_id text not null references public.appliances (id) on delete cascade,
  date text not null,
  type text not null check (type in ('repair','maintenance','inspection','replacement')),
  description text not null,
  cost numeric,
  vendor text,
  updated_at timestamptz not null default now()
);

create table public.schedules (
  id text primary key,
  appliance_id text not null references public.appliances (id) on delete cascade,
  title text not null,
  interval_months integer not null check (interval_months between 1 and 120),
  last_done text not null,
  updated_at timestamptz not null default now()
);

-- Deletion tombstones so offline devices learn about deletes made elsewhere.
create table public.deletions (
  entity text not null check (entity in ('organization','user','membership','property','unit','appliance','log','schedule')),
  id text not null,
  org_id text,
  deleted_at timestamptz not null default now(),
  primary key (entity, id)
);

create index idx_memberships_org on public.memberships (org_id);
create index idx_memberships_user on public.memberships (user_id);
create index idx_properties_org on public.properties (org_id);
create index idx_units_property on public.units (property_id);
create index idx_appliances_property on public.appliances (property_id);
create index idx_appliances_unit on public.appliances (unit_id);
create index idx_logs_appliance on public.maintenance_logs (appliance_id);
create index idx_schedules_appliance on public.schedules (appliance_id);
create index idx_deletions_deleted_at on public.deletions (deleted_at);

-- ---------- RLS helper functions ----------
-- security definer lets these read tables without re-triggering RLS
-- (avoids infinite recursion in the policies below).

create or replace function public.app_user_id()
returns text language sql stable security definer set search_path = public as $$
  select id from app_users where auth_id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from app_users where auth_id = auth.uid()), false)
$$;

create or replace function public.my_role(p_org_id text)
returns text language sql stable security definer set search_path = public as $$
  select m.role from memberships m
  where m.org_id = p_org_id and m.user_id = public.app_user_id()
$$;

-- Full-org access = member with no property/unit restriction.
create or replace function public.has_full_org_access(p_org_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = p_org_id and m.user_id = public.app_user_id()
      and m.property_ids is null and m.unit_ids is null
  )
$$;

create or replace function public.can_view_property(p_property_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1
    from properties p
    join memberships m on m.org_id = p.org_id and m.user_id = public.app_user_id()
    where p.id = p_property_id
      and (
        (m.property_ids is null and m.unit_ids is null)
        or p.id = any (coalesce(m.property_ids, '{}'))
        or exists (select 1 from units u where u.property_id = p.id
                   and u.id = any (coalesce(m.unit_ids, '{}')))
      )
  )
$$;

create or replace function public.can_view_unit(p_unit_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1
    from units u
    join properties p on p.id = u.property_id
    join memberships m on m.org_id = p.org_id and m.user_id = public.app_user_id()
    where u.id = p_unit_id
      and (
        (m.property_ids is null and m.unit_ids is null)
        or p.id = any (coalesce(m.property_ids, '{}'))
        or u.id = any (coalesce(m.unit_ids, '{}'))
      )
  )
$$;

create or replace function public.can_view_appliance(p_appliance_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1
    from appliances a
    join properties p on p.id = a.property_id
    join memberships m on m.org_id = p.org_id and m.user_id = public.app_user_id()
    where a.id = p_appliance_id
      and (
        (m.property_ids is null and m.unit_ids is null)
        or p.id = any (coalesce(m.property_ids, '{}'))
        or a.unit_id is null  -- building/common appliances visible to unit-scoped members
        or a.unit_id = any (coalesce(m.unit_ids, '{}'))
      )
  )
$$;

-- editProperties capability (owner/admin/manager) within a visible property.
create or replace function public.can_edit_property(p_property_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or (
    public.can_view_property(p_property_id)
    and (select public.my_role(p.org_id) from properties p where p.id = p_property_id)
        in ('owner','admin','manager')
  )
$$;

-- logMaintenance capability (owner/admin/manager/technician).
create or replace function public.can_log_in_property(p_property_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or (
    public.can_view_property(p_property_id)
    and (select public.my_role(p.org_id) from properties p where p.id = p_property_id)
        in ('owner','admin','manager','technician')
  )
$$;

create or replace function public.can_manage_members(p_org_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or public.my_role(p_org_id) in ('owner','admin')
$$;

create or replace function public.platform_admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_users where is_platform_admin)
$$;

create or replace function public.shares_org_with(p_user_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships mine
    join memberships theirs on theirs.org_id = mine.org_id
    where mine.user_id = public.app_user_id() and theirs.user_id = p_user_id
  )
$$;

-- ---------- Row-level security ----------

alter table public.app_users enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.appliances enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.schedules enable row level security;
alter table public.deletions enable row level security;

-- app_users: see yourself, platform admin, and people you share a company with.
create policy users_select on public.app_users for select
  using (auth_id = auth.uid() or public.is_platform_admin() or public.shares_org_with(id));
-- Signed-in users may create user records (needed when onboarding members),
-- but a platform-admin row can only be inserted by an existing platform admin
-- or when none exists yet ("the first user claims the platform").
create policy users_insert on public.app_users for insert
  with check (
    auth.uid() is not null
    and (not is_platform_admin
         or public.is_platform_admin()
         or not public.platform_admin_exists())
  );
create policy users_update on public.app_users for update
  using (auth_id = auth.uid() or public.is_platform_admin()
         or exists (select 1 from public.memberships m
                    where m.user_id = public.app_users.id and public.can_manage_members(m.org_id)));

-- organizations: members see theirs; only the platform owner creates/deletes.
create policy orgs_select on public.organizations for select
  using (public.is_platform_admin() or public.my_role(id) is not null);
create policy orgs_insert on public.organizations for insert
  with check (public.is_platform_admin());
create policy orgs_update on public.organizations for update
  using (public.is_platform_admin() or public.my_role(id) = 'owner');
create policy orgs_delete on public.organizations for delete
  using (public.is_platform_admin());

-- memberships: visible to co-members; managed by owner/admin/platform owner.
-- Only owners (or the platform owner) may grant the owner role.
create policy memberships_select on public.memberships for select
  using (public.is_platform_admin() or public.my_role(org_id) is not null);
create policy memberships_insert on public.memberships for insert
  with check (public.can_manage_members(org_id)
              and (role <> 'owner' or public.my_role(org_id) = 'owner' or public.is_platform_admin()));
create policy memberships_update on public.memberships for update
  using (public.can_manage_members(org_id)
         and (role <> 'owner' or public.my_role(org_id) = 'owner' or public.is_platform_admin()))
  with check (role <> 'owner' or public.my_role(org_id) = 'owner' or public.is_platform_admin());
create policy memberships_delete on public.memberships for delete
  using (public.can_manage_members(org_id)
         and (role <> 'owner' or public.my_role(org_id) = 'owner' or public.is_platform_admin()));

-- properties
create policy properties_select on public.properties for select
  using (public.can_view_property(id));
create policy properties_insert on public.properties for insert
  with check (public.is_platform_admin()
              or (public.my_role(org_id) in ('owner','admin','manager') and public.has_full_org_access(org_id)));
create policy properties_update on public.properties for update
  using (public.can_edit_property(id));
create policy properties_delete on public.properties for delete
  using (public.can_edit_property(id));

-- units
create policy units_select on public.units for select
  using (public.can_view_unit(id));
create policy units_insert on public.units for insert
  with check (public.can_edit_property(property_id));
create policy units_update on public.units for update
  using (public.can_edit_property(property_id));
create policy units_delete on public.units for delete
  using (public.can_edit_property(property_id));

-- appliances
create policy appliances_select on public.appliances for select
  using (public.can_view_appliance(id));
create policy appliances_insert on public.appliances for insert
  with check (public.can_edit_property(property_id));
create policy appliances_update on public.appliances for update
  using (public.can_edit_property(property_id));
create policy appliances_delete on public.appliances for delete
  using (public.can_edit_property(property_id));

-- maintenance logs: technicians can create; edits/deletes need editProperties.
create policy logs_select on public.maintenance_logs for select
  using (public.can_view_appliance(appliance_id));
create policy logs_insert on public.maintenance_logs for insert
  with check (exists (select 1 from public.appliances a
                      where a.id = appliance_id and public.can_log_in_property(a.property_id)));
create policy logs_update on public.maintenance_logs for update
  using (exists (select 1 from public.appliances a
                 where a.id = appliance_id and public.can_edit_property(a.property_id)));
create policy logs_delete on public.maintenance_logs for delete
  using (exists (select 1 from public.appliances a
                 where a.id = appliance_id and public.can_edit_property(a.property_id)));

-- schedules: managed by editProperties; "mark done" updates need technician access.
create policy schedules_select on public.schedules for select
  using (public.can_view_appliance(appliance_id));
create policy schedules_insert on public.schedules for insert
  with check (exists (select 1 from public.appliances a
                      where a.id = appliance_id and public.can_edit_property(a.property_id)));
create policy schedules_update on public.schedules for update
  using (exists (select 1 from public.appliances a
                 where a.id = appliance_id and public.can_log_in_property(a.property_id)));
create policy schedules_delete on public.schedules for delete
  using (exists (select 1 from public.appliances a
                 where a.id = appliance_id and public.can_edit_property(a.property_id)));

-- deletions: any signed-in user can record & read tombstones (they contain only ids).
create policy deletions_select on public.deletions for select
  using (auth.uid() is not null);
create policy deletions_insert on public.deletions for insert
  with check (auth.uid() is not null);
