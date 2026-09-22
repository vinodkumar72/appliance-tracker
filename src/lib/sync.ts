import { nowISO, today } from './dates';
import { useAppStore, uid } from './store';
import { supabase } from './supabase';
import type {
  Appliance,
  DeletionRecord,
  MaintenanceLog,
  Membership,
  Organization,
  Plan,
  Property,
  Schedule,
  Subscription,
  Unit,
  User,
} from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const nul = (v: unknown) => (v === undefined || v === '' ? null : v);
const und = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

// ---------- camelCase <-> snake_case mappers ----------

const toUserRow = (u: User): Row => ({
  id: u.id,
  name: u.name,
  email: u.email ?? '',
  phone: nul(u.phone),
  is_platform_admin: !!u.isPlatformAdmin,
  created_at: nul(u.createdAt),
  updated_at: u.updatedAt ?? new Date(0).toISOString(),
});
const fromUserRow = (r: Row): User => ({
  id: r.id,
  name: r.name,
  email: r.email ?? '',
  phone: und(r.phone),
  ...(r.is_platform_admin ? { isPlatformAdmin: true } : {}),
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

const toOrgRow = (o: Organization): Row => ({
  id: o.id,
  name: o.name,
  address: nul(o.address),
  phone: nul(o.phone),
  created_at: nul(o.createdAt),
  updated_at: o.updatedAt ?? new Date(0).toISOString(),
});
const fromOrgRow = (r: Row): Organization => ({
  id: r.id,
  name: r.name,
  address: und(r.address),
  phone: und(r.phone),
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

// An EMPTY scoping list must mean "unrestricted" (null), never "access to
// zero properties" — an empty array would silently strip a member of all
// edit rights (has_full_org_access fails server-side).
const scopeList = (ids: string[] | null | undefined): string[] | null =>
  ids && ids.length > 0 ? ids : null;

const toMembershipRow = (m: Membership): Row => ({
  id: m.id,
  org_id: m.orgId,
  user_id: m.userId,
  role: m.role,
  property_ids: scopeList(m.propertyIds),
  unit_ids: scopeList(m.unitIds),
  updated_at: m.updatedAt ?? new Date(0).toISOString(),
});
const fromMembershipRow = (r: Row): Membership => ({
  id: r.id,
  orgId: r.org_id,
  userId: r.user_id,
  role: r.role,
  ...(scopeList(r.property_ids) ? { propertyIds: r.property_ids } : {}),
  ...(scopeList(r.unit_ids) ? { unitIds: r.unit_ids } : {}),
  updatedAt: r.updated_at,
});

export const toPropertyRow = (p: Property): Row => ({
  id: p.id,
  org_id: p.orgId,
  name: p.name,
  address: p.address,
  notes: nul(p.notes),
  owner_name: nul(p.ownerName),
  owner_phone: nul(p.ownerPhone),
  owner_email: nul(p.ownerEmail),
  owner_mailing_address: nul(p.ownerMailingAddress),
  created_at: nul(p.createdAt),
  updated_at: p.updatedAt ?? new Date(0).toISOString(),
});
const fromPropertyRow = (r: Row): Property => ({
  id: r.id,
  orgId: r.org_id,
  name: r.name,
  address: r.address,
  notes: und(r.notes),
  ownerName: und(r.owner_name),
  ownerPhone: und(r.owner_phone),
  ownerEmail: und(r.owner_email),
  ownerMailingAddress: und(r.owner_mailing_address),
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

const toUnitRow = (u: Unit): Row => ({
  id: u.id,
  property_id: u.propertyId,
  name: u.name,
  notes: nul(u.notes),
  owner_name: nul(u.ownerName),
  owner_phone: nul(u.ownerPhone),
  owner_email: nul(u.ownerEmail),
  owner_mailing_address: nul(u.ownerMailingAddress),
  created_at: nul(u.createdAt),
  updated_at: u.updatedAt ?? new Date(0).toISOString(),
});
const fromUnitRow = (r: Row): Unit => ({
  id: r.id,
  propertyId: r.property_id,
  name: r.name,
  notes: und(r.notes),
  ownerName: und(r.owner_name),
  ownerPhone: und(r.owner_phone),
  ownerEmail: und(r.owner_email),
  ownerMailingAddress: und(r.owner_mailing_address),
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

const toApplianceRow = (a: Appliance): Row => ({
  id: a.id,
  property_id: a.propertyId,
  unit_id: nul(a.unitId),
  name: a.name,
  type: a.type,
  brand: nul(a.brand),
  model: nul(a.model),
  serial_number: nul(a.serialNumber),
  purchase_date: nul(a.purchaseDate),
  purchase_price: a.purchasePrice ?? null,
  warranty_expiry: nul(a.warrantyExpiry),
  warranty_provider: nul(a.warrantyProvider),
  notes: nul(a.notes),
  created_at: nul(a.createdAt),
  updated_at: a.updatedAt ?? new Date(0).toISOString(),
});
const fromApplianceRow = (r: Row): Appliance => ({
  id: r.id,
  propertyId: r.property_id,
  unitId: und(r.unit_id),
  name: r.name,
  type: r.type,
  brand: und(r.brand),
  model: und(r.model),
  serialNumber: und(r.serial_number),
  purchaseDate: und(r.purchase_date),
  purchasePrice: r.purchase_price === null ? undefined : Number(r.purchase_price),
  warrantyExpiry: und(r.warranty_expiry),
  warrantyProvider: und(r.warranty_provider),
  notes: und(r.notes),
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

const toLogRow = (l: MaintenanceLog): Row => ({
  id: l.id,
  appliance_id: l.applianceId,
  date: l.date,
  type: l.type,
  description: l.description,
  cost: l.cost ?? null,
  vendor: nul(l.vendor),
  updated_at: l.updatedAt ?? new Date(0).toISOString(),
});
const fromLogRow = (r: Row): MaintenanceLog => ({
  id: r.id,
  applianceId: r.appliance_id,
  date: r.date,
  type: r.type,
  description: r.description,
  cost: r.cost === null ? undefined : Number(r.cost),
  vendor: und(r.vendor),
  updatedAt: r.updated_at,
});

const toScheduleRow = (s: Schedule): Row => ({
  id: s.id,
  appliance_id: s.applianceId,
  title: s.title,
  interval_months: s.intervalMonths,
  last_done: s.lastDone,
  updated_at: s.updatedAt ?? new Date(0).toISOString(),
});
const fromScheduleRow = (r: Row): Schedule => ({
  id: r.id,
  applianceId: r.appliance_id,
  title: r.title,
  intervalMonths: r.interval_months,
  lastDone: r.last_done,
  updatedAt: r.updated_at,
});

const toPlanRow = (p: Plan): Row => ({
  id: p.id,
  name: p.name,
  emoji: nul(p.emoji),
  yearly_price: p.yearlyPrice,
  monthly_price: p.monthlyPrice ?? null,
  most_popular: p.mostPopular ?? false,
  max_units: p.maxUnits ?? null,
  min_units: p.minUnits ?? null,
  max_appliances_per_property: p.maxAppliancesPerProperty ?? null,
  trial_days: p.trialDays,
  created_at: nul(p.createdAt),
  updated_at: p.updatedAt ?? new Date(0).toISOString(),
});
const fromPlanRow = (r: Row): Plan => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji ?? undefined,
  yearlyPrice: Number(r.yearly_price),
  monthlyPrice: r.monthly_price === null ? undefined : Number(r.monthly_price),
  mostPopular: r.most_popular ? true : undefined,
  // Older rows only have max_properties; treat that value as the unit limit.
  maxUnits:
    r.max_units !== null && r.max_units !== undefined
      ? Number(r.max_units)
      : r.max_properties === null || r.max_properties === undefined
        ? undefined
        : Number(r.max_properties),
  minUnits: r.min_units === null || r.min_units === undefined ? undefined : Number(r.min_units),
  maxAppliancesPerProperty:
    r.max_appliances_per_property === null ? undefined : Number(r.max_appliances_per_property),
  trialDays: Number(r.trial_days),
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

const toSubscriptionRow = (s: Subscription): Row => ({
  id: s.id,
  org_id: s.orgId,
  plan_id: s.planId,
  status: s.status,
  started_at: s.startedAt,
  trial_ends_at: nul(s.trialEndsAt),
  current_period_end: nul(s.currentPeriodEnd),
  updated_at: s.updatedAt ?? new Date(0).toISOString(),
});
const fromSubscriptionRow = (r: Row): Subscription => ({
  id: r.id,
  orgId: r.org_id,
  planId: r.plan_id,
  status: r.status,
  startedAt: r.started_at,
  trialEndsAt: und(r.trial_ends_at),
  currentPeriodEnd: und(r.current_period_end),
  updatedAt: r.updated_at,
});

const ENTITY_TABLES: Record<DeletionRecord['entity'], string> = {
  organization: 'organizations',
  user: 'app_users',
  membership: 'memberships',
  property: 'properties',
  unit: 'units',
  appliance: 'appliances',
  log: 'maintenance_logs',
  schedule: 'schedules',
  plan: 'plans',
  subscription: 'subscriptions',
};

// ---------- auth linking ----------

/**
 * After sign-in, resolve which app user this login IS, in priority order:
 * 1. The server row already linked to this auth account (repeat sign-ins,
 *    other devices, local resets — always converges on the same identity).
 * 2. A local user with the same email.
 * 3. A local platform-admin placeholder (empty or *.test email, e.g. the
 *    seeded "Platform Owner (you)") — adopted as this real account, so the
 *    person who signs in becomes the platform owner they were acting as.
 * 4. A brand-new user — platform admin only if no admin exists yet.
 * Then set the session to that user and upsert their app_users row.
 */
export async function linkAuthUser(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  if (!authUser?.email) return 'Not signed in.';
  const email = authUser.email.toLowerCase();

  const { data: remoteRows, error: remoteError } = await supabase
    .from('app_users')
    .select('*')
    .eq('auth_id', authUser.id);
  if (remoteError) return `Could not look up account: ${remoteError.message}`;
  let remote = remoteRows?.[0] ? fromUserRow(remoteRows[0]) : null;
  if (!remote) {
    // Invited member: an admin created their record with this email before
    // they ever signed in — claim it so their role and access apply.
    const { data: byEmail } = await supabase
      .from('app_users')
      .select('*')
      .ilike('email', authUser.email)
      .limit(1);
    if (byEmail?.[0]) remote = fromUserRow(byEmail[0]);
  }

  const s = useAppStore.getState();
  let localUser: User | undefined;
  if (remote) {
    localUser = s.users.find((u) => u.id === remote.id);
    if (localUser) {
      localUser = { ...localUser, ...remote, updatedAt: nowISO() };
      useAppStore.setState((st) => ({
        users: st.users.map((u) => (u.id === localUser!.id ? localUser! : u)),
      }));
    } else {
      localUser = remote;
      useAppStore.setState((st) => ({ users: [...st.users, localUser!] }));
    }
  } else {
    localUser = s.users.find((u) => u.email && u.email.toLowerCase() === email);
    if (!localUser) {
      const placeholderAdmin = s.users.find(
        (u) => u.isPlatformAdmin && (!u.email || u.email.endsWith('.test')),
      );
      if (placeholderAdmin) {
        localUser = { ...placeholderAdmin, email: authUser.email, updatedAt: nowISO() };
        useAppStore.setState((st) => ({
          users: st.users.map((u) => (u.id === localUser!.id ? localUser! : u)),
        }));
      } else {
        const noAdminYet = !s.users.some((u) => u.isPlatformAdmin);
        localUser = {
          id: uid(),
          name: authUser.email.split('@')[0],
          email: authUser.email,
          ...(noAdminYet ? { isPlatformAdmin: true } : {}),
          createdAt: today(),
          updatedAt: nowISO(),
        };
        useAppStore.setState((st) => ({ users: [...st.users, localUser!] }));
      }
    }
  }
  useAppStore.setState((st) => ({
    session: { ...st.session, currentUserId: localUser!.id },
  }));

  let { error } = await supabase
    .from('app_users')
    .upsert({ ...toUserRow(localUser), auth_id: authUser.id }, { onConflict: 'id' });
  if (error && localUser.isPlatformAdmin && error.message.includes('row-level security')) {
    // Someone else already claimed platform ownership on the server —
    // continue as a regular user instead of failing the sync.
    localUser = { ...localUser, updatedAt: nowISO() };
    delete localUser.isPlatformAdmin;
    useAppStore.setState((st) => ({
      users: st.users.map((u) => (u.id === localUser!.id ? localUser! : u)),
    }));
    ({ error } = await supabase
      .from('app_users')
      .upsert({ ...toUserRow(localUser), auth_id: authUser.id }, { onConflict: 'id' }));
  }
  return error
    ? `Could not link account: ${error.message}${error.details ? ` — ${error.details}` : ''}`
    : null;
}

// ---------- sync ----------

export interface SyncResult {
  ok: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}

/** Plain-English table names for error messages. */
const FRIENDLY_TABLE_NAMES: Record<string, string> = {
  app_users: 'user',
  organizations: 'company',
  memberships: 'membership',
  properties: 'property',
  units: 'unit',
  appliances: 'appliance',
  maintenance_logs: 'log entry',
  schedules: 'maintenance schedule',
  plans: 'plan',
  subscriptions: 'subscription',
};

let inFlight: Promise<SyncResult> | null = null;

/**
 * Push local changes since the last sync, then pull remote changes. Last write wins.
 * Concurrent calls (e.g. pressing Sync now while a background sync runs) share
 * the in-flight run's result instead of failing.
 */
export function syncNow(): Promise<SyncResult> {
  if (!inFlight) {
    inFlight = runSync().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function runSync(): Promise<SyncResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { ok: false, pushed: 0, pulled: 0, error: 'Sign in to sync.' };
    }

    // Identity guard, part 1: demo/sample data must never sync. Signing in
    // ends demo mode and discards the sample portfolio — otherwise the first
    // sync tries to upload properties of a company the user isn't in.
    {
      const st = useAppStore.getState();
      if (st.demoMode || st.sampleDataLoaded) {
        st.resetAll();
        useAppStore.setState({ demoMode: false });
      }
    }

    // Identity guard, part 2: this device's data belongs to whichever login
    // last synced here. A different login must start from a clean slate —
    // pushing another account's leftovers is both a privacy problem and
    // guaranteed RLS rejections. (Null = fresh device or pre-sign-in local
    // work, which the first login legitimately adopts.)
    const authUserId = sessionData.session.user.id;
    if (useAppStore.getState().lastAuthUserId !== authUserId) {
      if (useAppStore.getState().lastAuthUserId !== null) {
        useAppStore.getState().resetAll();
      }
      useAppStore.setState({ lastAuthUserId: authUserId });
    }

    const linkError = await linkAuthUser();
    if (linkError) return { ok: false, pushed: 0, pulled: 0, error: linkError };

    // Fetch tombstones FIRST and prune local copies of records deleted on the
    // server (including server-side resets). Doing this before the push stops
    // a device from re-uploading ghost data — or dying with a permission
    // error while trying to.
    const { data: remoteDeletions, error: delError } = await supabase
      .from('deletions')
      .select('*');
    if (delError) throw new Error(`deletions: ${delError.message}`);
    const deletedIds = new Map<string, Set<string>>();
    for (const d of remoteDeletions ?? []) {
      if (!deletedIds.has(d.entity)) deletedIds.set(d.entity, new Set());
      deletedIds.get(d.entity)!.add(d.id);
    }
    const prune = <T extends { id: string }>(rows: T[], entity: DeletionRecord['entity']): T[] => {
      const gone = deletedIds.get(entity);
      return gone ? rows.filter((r) => !gone.has(r.id)) : rows;
    };
    {
      const st0 = useAppStore.getState();
      useAppStore.setState({
        users: prune(st0.users, 'user'),
        organizations: prune(st0.organizations, 'organization'),
        memberships: prune(st0.memberships, 'membership'),
        properties: prune(st0.properties, 'property'),
        units: prune(st0.units, 'unit'),
        appliances: prune(st0.appliances, 'appliance'),
        logs: prune(st0.logs, 'log'),
        schedules: prune(st0.schedules, 'schedule'),
        plans: prune(st0.plans, 'plan'),
        subscriptions: prune(st0.subscriptions, 'subscription'),
      });
    }

    const syncStartedAt = nowISO();
    const s = useAppStore.getState();
    const since = s.lastSyncAt;
    const pending = <T extends { updatedAt?: string }>(rows: T[]) =>
      since ? rows.filter((r) => r.updatedAt && r.updatedAt > since) : rows;

    let pushed = 0;

    // 1) Push deletes first (tombstones), so re-pushed parents don't resurrect children.
    const pendingDeletions = since
      ? s.deletions.filter((d) => d.deletedAt > since)
      : s.deletions;
    for (const d of pendingDeletions) {
      await supabase.from(ENTITY_TABLES[d.entity]).delete().eq('id', d.id);
      pushed++;
    }
    if (pendingDeletions.length > 0) {
      await supabase.from('deletions').upsert(
        pendingDeletions.map((d) => ({ entity: d.entity, id: d.id, deleted_at: d.deletedAt })),
        { onConflict: 'entity,id', ignoreDuplicates: true },
      );
    }

    // 2) Push upserts in dependency order.
    const rlsFriendly = (table: string, row: Row | undefined, message: string) => {
      const what = FRIENDLY_TABLE_NAMES[table] ?? table;
      const label = row && typeof row.name === 'string' && row.name ? ` ("${row.name}")` : '';
      const orgRef = row?.org_id ?? row?.id ?? 'n/a';
      return new Error(
        `Couldn't upload a ${what}${label} — your account doesn't have permission for it. ` +
          `This usually means leftover data from another account or an old test on this ` +
          `device: use "Reset all data" on the Company tab, then sign in again. ` +
          `(${table}: ${message}; record: ${row?.id ?? 'n/a'}; org: ${orgRef})`,
      );
    };

    /**
     * Push one row with layered fallbacks. Upsert is the fast path, but some
     * policy configurations reject ON CONFLICT writes from non-admins even
     * for brand-new rows (the UPDATE policy is checked against a row that
     * doesn't exist yet). Plain INSERT → UPDATE-on-duplicate sidesteps that
     * entirely: each path is checked only against its own policy.
     * Returns null on success, else the error message.
     */
    const pushRow = async (
      table: string,
      row: Row,
      ignoreDuplicates: boolean,
    ): Promise<string | null> => {
      const up = await supabase.from(table).upsert([row], { onConflict: 'id', ignoreDuplicates });
      if (!up.error) return null;
      if (!/row-level security/i.test(up.error.message)) return up.error.message;
      const ins = await supabase.from(table).insert([row]);
      if (!ins.error) return null;
      if (ins.error.code === '23505' || /duplicate key/i.test(ins.error.message)) {
        if (ignoreDuplicates) return null; // "insert if missing" semantics: row exists, done
        const upd = await supabase.from(table).update(row).eq('id', String(row.id));
        return upd.error ? upd.error.message : null;
      }
      return ins.error.message;
    };

    const pushTable = async (table: string, rows: Row[], ignoreDuplicates = false) => {
      if (rows.length === 0) return;
      const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: 'id', ignoreDuplicates });
      if (!error) {
        pushed += rows.length;
        return;
      }
      // Batch failed (all-or-nothing): go row by row with fallbacks, so good
      // records still land and any error names the actual offender.
      for (const row of rows) {
        const msg = await pushRow(table, row, ignoreDuplicates);
        if (msg) {
          if (/row-level security/i.test(msg)) throw rlsFriendly(table, row, msg);
          throw new Error(`${table}: ${msg}`);
        }
        pushed++;
      }
    };
    // Other people's user rows can't be updated by us — insert-only for those.
    // Only the signed-in user's own row may carry the platform-admin flag;
    // the server is the authority on everyone else's.
    const selfUserId = useAppStore.getState().session.currentUserId;
    await pushTable(
      'app_users',
      pending(s.users).map((u) =>
        toUserRow(u.id === selfUserId ? u : { ...u, isPlatformAdmin: false }),
      ),
      true,
    );
    await pushTable('plans', pending(s.plans).map(toPlanRow));
    await pushTable('organizations', pending(s.organizations).map(toOrgRow));
    await pushTable('subscriptions', pending(s.subscriptions).map(toSubscriptionRow));
    await pushTable('memberships', pending(s.memberships).map(toMembershipRow));
    await pushTable('properties', pending(s.properties).map(toPropertyRow));
    await pushTable('units', pending(s.units).map(toUnitRow));
    await pushTable('appliances', pending(s.appliances).map(toApplianceRow));
    await pushTable('maintenance_logs', pending(s.logs).map(toLogRow));
    await pushTable('schedules', pending(s.schedules).map(toScheduleRow));

    // 3) Pull everything visible to this user (RLS scopes it) and merge, newest wins.
    const pullTable = async <T extends { id: string; updatedAt?: string }>(
      table: string,
      fromRow: (r: Row) => T,
    ): Promise<T[]> => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw new Error(`${table}: ${error.message}`);
      return (data ?? []).map(fromRow);
    };

    const [
      rUsers,
      rOrgs,
      rMemberships,
      rProperties,
      rUnits,
      rAppliances,
      rLogs,
      rSchedules,
      rPlans,
      rSubscriptions,
    ] = await Promise.all([
      pullTable('app_users', fromUserRow),
      pullTable('organizations', fromOrgRow),
      pullTable('memberships', fromMembershipRow),
      pullTable('properties', fromPropertyRow),
      pullTable('units', fromUnitRow),
      pullTable('appliances', fromApplianceRow),
      pullTable('maintenance_logs', fromLogRow),
      pullTable('schedules', fromScheduleRow),
      pullTable('plans', fromPlanRow),
      pullTable('subscriptions', fromSubscriptionRow),
    ]);

    // (deletedIds was fetched and applied before the push, above.)
    const merge = <T extends { id: string; updatedAt?: string }>(
      local: T[],
      remote: T[],
      entity: DeletionRecord['entity'],
    ): T[] => {
      const gone = deletedIds.get(entity) ?? new Set<string>();
      const map = new Map(local.map((r) => [r.id, r]));
      for (const rec of remote) {
        const cur = map.get(rec.id);
        if (!cur || (rec.updatedAt ?? '') >= (cur.updatedAt ?? '')) map.set(rec.id, rec);
      }
      return [...map.values()].filter((r) => !gone.has(r.id));
    };

    const st = useAppStore.getState();
    const pulled =

      rUsers.length + rOrgs.length + rMemberships.length + rProperties.length +
      rUnits.length + rAppliances.length + rLogs.length + rSchedules.length +
      rPlans.length + rSubscriptions.length;
    useAppStore.setState({
      users: merge(st.users, rUsers, 'user'),
      organizations: merge(st.organizations, rOrgs, 'organization'),
      memberships: merge(st.memberships, rMemberships, 'membership'),
      properties: merge(st.properties, rProperties, 'property'),
      units: merge(st.units, rUnits, 'unit'),
      appliances: merge(st.appliances, rAppliances, 'appliance'),
      logs: merge(st.logs, rLogs, 'log'),
      schedules: merge(st.schedules, rSchedules, 'schedule'),
      plans: merge(st.plans, rPlans, 'plan'),
      subscriptions: merge(st.subscriptions, rSubscriptions, 'subscription'),
      lastSyncAt: syncStartedAt,
    });

    // First sync on a device: no company is selected yet — pick a sensible
    // default (a company they belong to, else the first one they can see).
    const after = useAppStore.getState();
    const orgMissing =
      !after.session.currentOrgId ||
      !after.organizations.some((o) => o.id === after.session.currentOrgId);
    if (orgMissing) {
      const membershipOrg = after.memberships.find(
        (m) => m.userId === after.session.currentUserId,
      )?.orgId;
      const fallbackOrg = membershipOrg ?? after.organizations[0]?.id ?? null;
      if (fallbackOrg) {
        useAppStore.setState({ session: { ...after.session, currentOrgId: fallbackOrg } });
      }
    }

    return { ok: true, pushed, pulled };
  } catch (e) {
    return { ok: false, pushed: 0, pulled: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
