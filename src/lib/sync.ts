import { nowISO, today } from './dates';
import { useAppStore, uid } from './store';
import { supabase } from './supabase';
import type {
  Appliance,
  DeletionRecord,
  MaintenanceLog,
  Membership,
  Organization,
  Property,
  Schedule,
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
  is_platform_admin: !!u.isPlatformAdmin,
  created_at: nul(u.createdAt),
  updated_at: u.updatedAt ?? new Date(0).toISOString(),
});
const fromUserRow = (r: Row): User => ({
  id: r.id,
  name: r.name,
  email: r.email ?? '',
  ...(r.is_platform_admin ? { isPlatformAdmin: true } : {}),
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

const toOrgRow = (o: Organization): Row => ({
  id: o.id,
  name: o.name,
  created_at: nul(o.createdAt),
  updated_at: o.updatedAt ?? new Date(0).toISOString(),
});
const fromOrgRow = (r: Row): Organization => ({
  id: r.id,
  name: r.name,
  createdAt: r.created_at ?? today(),
  updatedAt: r.updated_at,
});

const toMembershipRow = (m: Membership): Row => ({
  id: m.id,
  org_id: m.orgId,
  user_id: m.userId,
  role: m.role,
  property_ids: m.propertyIds ?? null,
  unit_ids: m.unitIds ?? null,
  updated_at: m.updatedAt ?? new Date(0).toISOString(),
});
const fromMembershipRow = (r: Row): Membership => ({
  id: r.id,
  orgId: r.org_id,
  userId: r.user_id,
  role: r.role,
  ...(r.property_ids ? { propertyIds: r.property_ids } : {}),
  ...(r.unit_ids ? { unitIds: r.unit_ids } : {}),
  updatedAt: r.updated_at,
});

const toPropertyRow = (p: Property): Row => ({
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

const ENTITY_TABLES: Record<DeletionRecord['entity'], string> = {
  organization: 'organizations',
  user: 'app_users',
  membership: 'memberships',
  property: 'properties',
  unit: 'units',
  appliance: 'appliances',
  log: 'maintenance_logs',
  schedule: 'schedules',
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
  const remote = remoteRows?.[0] ? fromUserRow(remoteRows[0]) : null;

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

let syncing = false;

/** Push local changes since the last sync, then pull remote changes. Last write wins. */
export async function syncNow(): Promise<SyncResult> {
  if (syncing) return { ok: false, pushed: 0, pulled: 0, error: 'Sync already running.' };
  syncing = true;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { ok: false, pushed: 0, pulled: 0, error: 'Sign in to sync.' };
    }
    const linkError = await linkAuthUser();
    if (linkError) return { ok: false, pushed: 0, pulled: 0, error: linkError };

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
    const pushTable = async (table: string, rows: Row[], ignoreDuplicates = false) => {
      if (rows.length === 0) return;
      const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: 'id', ignoreDuplicates });
      if (error) {
        throw new Error(
          `${table}: ${error.message}${error.details ? ` — ${error.details}` : ''}`,
        );
      }
      pushed += rows.length;
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
    await pushTable('organizations', pending(s.organizations).map(toOrgRow));
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

    const [rUsers, rOrgs, rMemberships, rProperties, rUnits, rAppliances, rLogs, rSchedules] =
      await Promise.all([
        pullTable('app_users', fromUserRow),
        pullTable('organizations', fromOrgRow),
        pullTable('memberships', fromMembershipRow),
        pullTable('properties', fromPropertyRow),
        pullTable('units', fromUnitRow),
        pullTable('appliances', fromApplianceRow),
        pullTable('maintenance_logs', fromLogRow),
        pullTable('schedules', fromScheduleRow),
      ]);

    const { data: remoteDeletions, error: delError } = await supabase
      .from('deletions')
      .select('*');
    if (delError) throw new Error(`deletions: ${delError.message}`);
    const deletedIds = new Map<string, Set<string>>();
    for (const d of remoteDeletions ?? []) {
      if (!deletedIds.has(d.entity)) deletedIds.set(d.entity, new Set());
      deletedIds.get(d.entity)!.add(d.id);
    }

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
      rUnits.length + rAppliances.length + rLogs.length + rSchedules.length;
    useAppStore.setState({
      users: merge(st.users, rUsers, 'user'),
      organizations: merge(st.organizations, rOrgs, 'organization'),
      memberships: merge(st.memberships, rMemberships, 'membership'),
      properties: merge(st.properties, rProperties, 'property'),
      units: merge(st.units, rUnits, 'unit'),
      appliances: merge(st.appliances, rAppliances, 'appliance'),
      logs: merge(st.logs, rLogs, 'log'),
      schedules: merge(st.schedules, rSchedules, 'schedule'),
      lastSyncAt: syncStartedAt,
    });

    return { ok: true, pushed, pulled };
  } catch (e) {
    return { ok: false, pushed: 0, pulled: 0, error: e instanceof Error ? e.message : String(e) };
  } finally {
    syncing = false;
  }
}
