import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { addMonths, daysUntil, nowISO, today } from './dates';
import { APPLIANCE_TYPES } from './defaults';
import { buildSeedData } from './seed';
import type {
  Appliance,
  DeletionRecord,
  MaintenanceLog,
  Membership,
  Organization,
  Property,
  Role,
  Schedule,
  ScheduleWithDue,
  Session,
  Unit,
  User,
} from './types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

interface AppState {
  organizations: Organization[];
  users: User[];
  memberships: Membership[];
  session: Session;
  properties: Property[];
  units: Unit[];
  appliances: Appliance[];
  logs: MaintenanceLog[];
  schedules: Schedule[];
  /** Tombstones for local deletes, replayed against the server on sync. */
  deletions: DeletionRecord[];
  /** When this device last synced with the backend; null = never / no backend yet. */
  lastSyncAt: string | null;
  hydrated: boolean;

  /** Sets up the software operator account (first run). */
  bootstrapPlatformAdmin: (name: string, email: string) => void;
  /** Marks the current user as platform owner (for data created before this concept existed). */
  claimPlatformOwnership: () => void;
  /**
   * Onboards a company: creates the org and its first Owner user (matched by
   * email if they already exist). The platform admin stays signed in as
   * themselves; the session switches to viewing the new org.
   */
  createOrganization: (name: string, ownerName: string, ownerEmail?: string) => string;
  renameOrganization: (id: string, name: string) => void;
  switchOrganization: (orgId: string) => void;
  /** Demo helper: act as another member of the current org. */
  switchUser: (userId: string) => void;
  addMember: (
    name: string,
    email: string,
    role: Role,
    propertyIds?: string[],
    unitIds?: string[],
  ) => void;
  /** Pass propertyIds/unitIds: null to clear that restriction, an array to set it. */
  updateMembership: (
    membershipId: string,
    patch: { role?: Role; propertyIds?: string[] | null; unitIds?: string[] | null },
  ) => void;
  removeMember: (membershipId: string) => void;

  addProperty: (p: Omit<Property, 'id' | 'orgId' | 'createdAt'>) => string;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  addUnit: (u: Omit<Unit, 'id' | 'createdAt'>) => string;
  updateUnit: (id: string, patch: Partial<Unit>) => void;
  /** Deletes the unit; its appliances move to the building / common area. */
  deleteUnit: (id: string) => void;

  addAppliance: (a: Omit<Appliance, 'id' | 'createdAt'>, withDefaultSchedules: boolean) => string;
  updateAppliance: (id: string, patch: Partial<Appliance>) => void;
  deleteAppliance: (id: string) => void;

  addLog: (l: Omit<MaintenanceLog, 'id'>) => void;
  updateLog: (id: string, patch: Partial<MaintenanceLog>) => void;
  deleteLog: (id: string) => void;

  addSchedule: (s: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: string, patch: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  /** Resets the schedule clock to today and records a maintenance log entry. */
  markScheduleDone: (id: string) => void;

  loadSampleData: () => void;
  resetAll: () => void;
}

const EMPTY_SESSION: Session = { currentUserId: null, currentOrgId: null };

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      organizations: [],
      users: [],
      memberships: [],
      session: EMPTY_SESSION,
      properties: [],
      units: [],
      appliances: [],
      logs: [],
      schedules: [],
      deletions: [],
      lastSyncAt: null,
      hydrated: false,

      bootstrapPlatformAdmin: (name, email) => {
        const id = uid();
        set((s) => ({
          users: [
            ...s.users,
            {
              id,
              name: name.trim(),
              email: email.trim(),
              isPlatformAdmin: true,
              createdAt: today(),
              updatedAt: nowISO(),
            },
          ],
          session: { ...s.session, currentUserId: id },
        }));
      },
      claimPlatformOwnership: () =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === s.session.currentUserId
              ? { ...u, isPlatformAdmin: true, updatedAt: nowISO() }
              : u,
          ),
        })),
      createOrganization: (name, ownerName, ownerEmail) => {
        const orgId = uid();
        set((s) => {
          const email = ownerEmail?.trim() ?? '';
          const existingOwner = email
            ? s.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase())
            : undefined;
          const ownerId = existingOwner?.id ?? uid();
          const users = existingOwner
            ? s.users
            : [
                ...s.users,
                {
                  id: ownerId,
                  name: ownerName.trim() || 'Owner',
                  email,
                  createdAt: today(),
                  updatedAt: nowISO(),
                },
              ];
          return {
            organizations: [
              ...s.organizations,
              { id: orgId, name: name.trim(), createdAt: today(), updatedAt: nowISO() },
            ],
            users,
            memberships: [
              ...s.memberships,
              { id: uid(), orgId, userId: ownerId, role: 'owner' as Role, updatedAt: nowISO() },
            ],
            session: { ...s.session, currentOrgId: orgId },
          };
        });
        return orgId;
      },
      renameOrganization: (id, name) =>
        set((s) => ({
          organizations: s.organizations.map((o) =>
            o.id === id ? { ...o, name: name.trim(), updatedAt: nowISO() } : o,
          ),
        })),
      switchOrganization: (orgId) =>
        set((s) => {
          // Keep the current user if they belong to the target org; otherwise act as its first member.
          const members = s.memberships.filter((m) => m.orgId === orgId);
          const stillMember = members.some((m) => m.userId === s.session.currentUserId);
          const currentUserId = stillMember
            ? s.session.currentUserId
            : (members[0]?.userId ?? s.session.currentUserId);
          return { session: { currentOrgId: orgId, currentUserId } };
        }),
      switchUser: (userId) =>
        set((s) => ({ session: { ...s.session, currentUserId: userId } })),
      addMember: (name, email, role, propertyIds, unitIds) =>
        set((s) => {
          if (!s.session.currentOrgId) return s;
          const existing = s.users.find(
            (u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase(),
          );
          const userId = existing?.id ?? uid();
          const users = existing
            ? s.users
            : [
                ...s.users,
                {
                  id: userId,
                  name: name.trim(),
                  email: email.trim(),
                  createdAt: today(),
                  updatedAt: nowISO(),
                },
              ];
          const alreadyMember = s.memberships.some(
            (m) => m.orgId === s.session.currentOrgId && m.userId === userId,
          );
          const membership: Membership = {
            id: uid(),
            orgId: s.session.currentOrgId!,
            userId,
            role,
            ...(propertyIds && propertyIds.length > 0 ? { propertyIds } : {}),
            ...(unitIds && unitIds.length > 0 ? { unitIds } : {}),
            updatedAt: nowISO(),
          };
          return {
            users,
            memberships: alreadyMember ? s.memberships : [...s.memberships, membership],
          };
        }),
      updateMembership: (membershipId, patch) =>
        set((s) => ({
          memberships: s.memberships.map((m) => {
            if (m.id !== membershipId) return m;
            const next = { ...m };
            if (patch.role) next.role = patch.role;
            if (patch.propertyIds === null) {
              delete next.propertyIds;
            } else if (patch.propertyIds) {
              next.propertyIds = patch.propertyIds;
            }
            if (patch.unitIds === null) {
              delete next.unitIds;
            } else if (patch.unitIds) {
              next.unitIds = patch.unitIds;
            }
            next.updatedAt = nowISO();
            return next;
          }),
        })),
      removeMember: (membershipId) =>
        set((s) => {
          const target = s.memberships.find((m) => m.id === membershipId);
          if (!target) return s;
          const memberships = s.memberships.filter((m) => m.id !== membershipId);
          // If the acting user removed themselves, fall back to the org's first remaining member.
          let session = s.session;
          if (target.userId === s.session.currentUserId && target.orgId === s.session.currentOrgId) {
            const next = memberships.find((m) => m.orgId === target.orgId);
            session = { ...s.session, currentUserId: next?.userId ?? null };
          }
          return {
            memberships,
            session,
            deletions: [
              ...s.deletions,
              { entity: 'membership' as const, id: membershipId, deletedAt: nowISO() },
            ],
          };
        }),

      addProperty: (p) => {
        const id = uid();
        const orgId = get().session.currentOrgId;
        if (!orgId) return id;
        set((s) => ({
          properties: [
            ...s.properties,
            { ...p, id, orgId, createdAt: today(), updatedAt: nowISO() },
          ],
        }));
        return id;
      },
      updateProperty: (id, patch) =>
        set((s) => ({
          properties: s.properties.map((p) =>
            p.id === id ? { ...p, ...patch, id, updatedAt: nowISO() } : p,
          ),
        })),
      deleteProperty: (id) =>
        set((s) => {
          const applianceIds = new Set(
            s.appliances.filter((a) => a.propertyId === id).map((a) => a.id),
          );
          const removedUnitIds = new Set(
            s.units.filter((u) => u.propertyId === id).map((u) => u.id),
          );
          const at = nowISO();
          const tombstones: DeletionRecord[] = [
            { entity: 'property', id, deletedAt: at },
            ...[...removedUnitIds].map((u) => ({ entity: 'unit' as const, id: u, deletedAt: at })),
            ...[...applianceIds].map((a) => ({ entity: 'appliance' as const, id: a, deletedAt: at })),
            ...s.logs
              .filter((l) => applianceIds.has(l.applianceId))
              .map((l) => ({ entity: 'log' as const, id: l.id, deletedAt: at })),
            ...s.schedules
              .filter((sc) => applianceIds.has(sc.applianceId))
              .map((sc) => ({ entity: 'schedule' as const, id: sc.id, deletedAt: at })),
          ];
          return {
            deletions: [...s.deletions, ...tombstones],
            properties: s.properties.filter((p) => p.id !== id),
            units: s.units.filter((u) => u.propertyId !== id),
            appliances: s.appliances.filter((a) => a.propertyId !== id),
            logs: s.logs.filter((l) => !applianceIds.has(l.applianceId)),
            schedules: s.schedules.filter((sc) => !applianceIds.has(sc.applianceId)),
            memberships: s.memberships.map((m) => {
              if (!m.propertyIds && !m.unitIds) return m;
              const next = { ...m };
              if (next.propertyIds) next.propertyIds = next.propertyIds.filter((pid) => pid !== id);
              if (next.unitIds) next.unitIds = next.unitIds.filter((u) => !removedUnitIds.has(u));
              next.updatedAt = at;
              return next;
            }),
          };
        }),

      addUnit: (u) => {
        const id = uid();
        set((s) => ({
          units: [...s.units, { ...u, id, createdAt: today(), updatedAt: nowISO() }],
        }));
        return id;
      },
      updateUnit: (id, patch) =>
        set((s) => ({
          units: s.units.map((u) => (u.id === id ? { ...u, ...patch, id, updatedAt: nowISO() } : u)),
        })),
      deleteUnit: (id) =>
        set((s) => {
          const at = nowISO();
          return {
            units: s.units.filter((u) => u.id !== id),
            appliances: s.appliances.map((a) =>
              a.unitId === id ? { ...a, unitId: undefined, updatedAt: at } : a,
            ),
            memberships: s.memberships.map((m) =>
              m.unitIds ? { ...m, unitIds: m.unitIds.filter((u) => u !== id), updatedAt: at } : m,
            ),
            deletions: [...s.deletions, { entity: 'unit' as const, id, deletedAt: at }],
          };
        }),

      addAppliance: (a, withDefaultSchedules) => {
        const id = uid();
        const newSchedules: Schedule[] = withDefaultSchedules
          ? APPLIANCE_TYPES[a.type].defaultSchedules.map((d) => ({
              id: uid(),
              applianceId: id,
              title: d.title,
              intervalMonths: d.intervalMonths,
              lastDone: a.purchaseDate || today(),
              updatedAt: nowISO(),
            }))
          : [];
        set((s) => ({
          appliances: [...s.appliances, { ...a, id, createdAt: today(), updatedAt: nowISO() }],
          schedules: [...s.schedules, ...newSchedules],
        }));
        return id;
      },
      updateAppliance: (id, patch) =>
        set((s) => ({
          appliances: s.appliances.map((a) =>
            a.id === id ? { ...a, ...patch, id, updatedAt: nowISO() } : a,
          ),
        })),
      deleteAppliance: (id) =>
        set((s) => {
          const at = nowISO();
          return {
            appliances: s.appliances.filter((a) => a.id !== id),
            logs: s.logs.filter((l) => l.applianceId !== id),
            schedules: s.schedules.filter((sc) => sc.applianceId !== id),
            deletions: [
              ...s.deletions,
              { entity: 'appliance' as const, id, deletedAt: at },
              ...s.logs
                .filter((l) => l.applianceId === id)
                .map((l) => ({ entity: 'log' as const, id: l.id, deletedAt: at })),
              ...s.schedules
                .filter((sc) => sc.applianceId === id)
                .map((sc) => ({ entity: 'schedule' as const, id: sc.id, deletedAt: at })),
            ],
          };
        }),

      addLog: (l) =>
        set((s) => ({ logs: [...s.logs, { ...l, id: uid(), updatedAt: nowISO() }] })),
      updateLog: (id, patch) =>
        set((s) => ({
          logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch, id, updatedAt: nowISO() } : l)),
        })),
      deleteLog: (id) =>
        set((s) => ({
          logs: s.logs.filter((l) => l.id !== id),
          deletions: [...s.deletions, { entity: 'log' as const, id, deletedAt: nowISO() }],
        })),

      addSchedule: (sc) =>
        set((s) => ({
          schedules: [...s.schedules, { ...sc, id: uid(), updatedAt: nowISO() }],
        })),
      updateSchedule: (id, patch) =>
        set((s) => ({
          schedules: s.schedules.map((sc) =>
            sc.id === id ? { ...sc, ...patch, id, updatedAt: nowISO() } : sc,
          ),
        })),
      deleteSchedule: (id) =>
        set((s) => ({
          schedules: s.schedules.filter((sc) => sc.id !== id),
          deletions: [...s.deletions, { entity: 'schedule' as const, id, deletedAt: nowISO() }],
        })),
      markScheduleDone: (id) => {
        const sc = get().schedules.find((x) => x.id === id);
        if (!sc) return;
        set((s) => ({
          schedules: s.schedules.map((x) =>
            x.id === id ? { ...x, lastDone: today(), updatedAt: nowISO() } : x,
          ),
          logs: [
            ...s.logs,
            {
              id: uid(),
              applianceId: sc.applianceId,
              date: today(),
              type: 'maintenance',
              description: sc.title,
              updatedAt: nowISO(),
            },
          ],
        }));
      },

      loadSampleData: () => set({ ...buildSeedData(), deletions: [], lastSyncAt: null }),
      resetAll: () =>
        set({
          organizations: [],
          users: [],
          memberships: [],
          session: EMPTY_SESSION,
          properties: [],
          units: [],
          appliances: [],
          logs: [],
          schedules: [],
          deletions: [],
          lastSyncAt: null,
        }),
    }),
    {
      name: 'appliance-tracker-v1',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        organizations: s.organizations,
        users: s.users,
        memberships: s.memberships,
        session: s.session,
        properties: s.properties,
        units: s.units,
        appliances: s.appliances,
        logs: s.logs,
        schedules: s.schedules,
        deletions: s.deletions,
        lastSyncAt: s.lastSyncAt,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<AppState>;
        if (version < 1) {
          // v0 had no organizations. Wrap any existing data in a default company.
          const hasData = (state.properties?.length ?? 0) > 0;
          if (hasData) {
            const orgId = uid();
            const userId = uid();
            state.organizations = [{ id: orgId, name: 'My Company', createdAt: today() }];
            state.users = [{ id: userId, name: 'You', email: '', createdAt: today() }];
            state.memberships = [{ id: uid(), orgId, userId, role: 'owner' }];
            state.session = { currentUserId: userId, currentOrgId: orgId };
            state.properties = (state.properties ?? []).map((p) => ({ ...p, orgId }));
          } else {
            state.organizations = [];
            state.users = [];
            state.memberships = [];
            state.session = EMPTY_SESSION;
          }
        }
        if (version < 2) {
          state.units = state.units ?? [];
        }
        if (version < 3) {
          state.deletions = state.deletions ?? [];
          state.lastSyncAt = state.lastSyncAt ?? null;
        }
        return state;
      },
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
    },
  ),
);

/** The current org, user, their membership, and their role in that org. */
export function useSessionInfo() {
  const organizations = useAppStore((s) => s.organizations);
  const users = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => s.memberships);
  const session = useAppStore((s) => s.session);

  const currentOrg = organizations.find((o) => o.id === session.currentOrgId) ?? null;
  const currentUser = users.find((u) => u.id === session.currentUserId) ?? null;
  const membership =
    memberships.find(
      (m) => m.orgId === session.currentOrgId && m.userId === session.currentUserId,
    ) ?? null;
  const role: Role | null = membership?.role ?? null;
  /** True when the member's access is limited to specific properties or units. */
  const isPropertyScoped = !!(membership?.propertyIds || membership?.unitIds);
  const isPlatformAdmin = !!currentUser?.isPlatformAdmin;
  return { currentOrg, currentUser, membership, role, isPropertyScoped, isPlatformAdmin };
}

/** All data scoped to the current organization. */
export function useOrgData() {
  const session = useAppStore((s) => s.session);
  const allUsers = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => s.memberships);
  const allProperties = useAppStore((s) => s.properties);
  const allUnits = useAppStore((s) => s.units);
  const allAppliances = useAppStore((s) => s.appliances);
  const allLogs = useAppStore((s) => s.logs);
  const allSchedules = useAppStore((s) => s.schedules);

  // Access control: non-members see nothing. A scoped member sees their
  // granted properties in full, plus — for unit grants — the parent property
  // with only the granted units and the building/common appliances.
  const membership = memberships.find(
    (m) => m.orgId === session.currentOrgId && m.userId === session.currentUserId,
  );
  // The platform owner has oversight of every company's data.
  const isPlatformAdmin = !!allUsers.find((u) => u.id === session.currentUserId)?.isPlatformAdmin;
  const scoped = !isPlatformAdmin && !!(membership?.propertyIds || membership?.unitIds);
  const fullPropertyIds = new Set(membership?.propertyIds ?? []);
  const grantedUnitIds = new Set(membership?.unitIds ?? []);
  const unitParentIds = new Set(
    allUnits.filter((u) => grantedUnitIds.has(u.id)).map((u) => u.propertyId),
  );

  let properties = allProperties.filter((p) => p.orgId === session.currentOrgId);
  if (!membership && !isPlatformAdmin) {
    properties = [];
  } else if (scoped) {
    properties = properties.filter((p) => fullPropertyIds.has(p.id) || unitParentIds.has(p.id));
  }
  const propertyIds = new Set(properties.map((p) => p.id));

  let units = allUnits.filter((u) => propertyIds.has(u.propertyId));
  let appliances = allAppliances.filter((a) => propertyIds.has(a.propertyId));
  if (scoped) {
    units = units.filter((u) => fullPropertyIds.has(u.propertyId) || grantedUnitIds.has(u.id));
    appliances = appliances.filter(
      (a) => fullPropertyIds.has(a.propertyId) || !a.unitId || grantedUnitIds.has(a.unitId),
    );
  }
  const applianceIds = new Set(appliances.map((a) => a.id));
  const logs = allLogs.filter((l) => applianceIds.has(l.applianceId));
  const schedules = allSchedules.filter((sc) => applianceIds.has(sc.applianceId));
  return { properties, units, appliances, logs, schedules };
}

/**
 * Number of local changes not yet pushed to a backend: records created or
 * updated since the last sync, plus pending deletions.
 */
export function usePendingChanges(): number {
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const organizations = useAppStore((s) => s.organizations);
  const users = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => s.memberships);
  const properties = useAppStore((s) => s.properties);
  const units = useAppStore((s) => s.units);
  const appliances = useAppStore((s) => s.appliances);
  const logs = useAppStore((s) => s.logs);
  const schedules = useAppStore((s) => s.schedules);
  const deletions = useAppStore((s) => s.deletions);

  const isPending = (updatedAt?: string) =>
    !!updatedAt && (!lastSyncAt || updatedAt > lastSyncAt);
  const all: { updatedAt?: string }[] = [
    ...organizations,
    ...users,
    ...memberships,
    ...properties,
    ...units,
    ...appliances,
    ...logs,
    ...schedules,
  ];
  return (
    all.filter((x) => isPending(x.updatedAt)).length +
    deletions.filter((d) => !lastSyncAt || d.deletedAt > lastSyncAt).length
  );
}

/** All schedules joined with appliance/property info and due dates, soonest first. */
export function getSchedulesWithDue(s: {
  schedules: Schedule[];
  appliances: Appliance[];
  properties: Property[];
  units?: Unit[];
}): ScheduleWithDue[] {
  return s.schedules
    .map((sc): ScheduleWithDue | null => {
      const appliance = s.appliances.find((a) => a.id === sc.applianceId);
      if (!appliance) return null;
      const property = s.properties.find((p) => p.id === appliance.propertyId);
      const unit = appliance.unitId ? s.units?.find((u) => u.id === appliance.unitId) : undefined;
      const nextDue = addMonths(sc.lastDone, sc.intervalMonths);
      return {
        ...sc,
        nextDue,
        daysUntilDue: daysUntil(nextDue),
        applianceName: appliance.name,
        propertyId: appliance.propertyId,
        propertyName: property?.name ?? 'Unknown property',
        unitName: unit?.name,
      };
    })
    .filter((x): x is ScheduleWithDue => x !== null)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
