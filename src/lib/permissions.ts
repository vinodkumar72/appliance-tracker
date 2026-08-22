import type { Role } from './types';

/**
 * What a role is allowed to do inside an organization.
 * - manageOrg: rename the organization
 * - manageUsers: invite members, change roles, remove members
 * - editProperties: create/edit/delete properties, appliances, and schedules
 * - logMaintenance: add repair/maintenance logs and mark scheduled tasks done
 * Viewers hold no actions — read-only access to everything in the org.
 */
export type Action = 'manageOrg' | 'manageUsers' | 'editProperties' | 'logMaintenance';

const PERMISSIONS: Record<Role, Action[]> = {
  owner: ['manageOrg', 'manageUsers', 'editProperties', 'logMaintenance'],
  admin: ['manageUsers', 'editProperties', 'logMaintenance'],
  manager: ['editProperties', 'logMaintenance'],
  technician: ['logMaintenance'],
  viewer: [],
  investor: [],
};

export function can(role: Role | null, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role].includes(action);
}

export const ROLE_ORDER: Role[] = ['owner', 'admin', 'manager', 'technician', 'viewer', 'investor'];

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  technician: 'Technician',
  viewer: 'Viewer',
  investor: 'Investor',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full control, including organization settings and all members',
  admin: 'Manages members and all properties',
  manager: 'Manages properties, appliances, and schedules',
  technician: 'Logs repairs and completes maintenance tasks',
  viewer: 'Read-only access',
  investor: 'Property owner — read-only access, usually limited to their own properties',
};

/** Roles the acting user may assign to others. Only owners may create other owners. */
export function assignableRoles(actorRole: Role | null): Role[] {
  if (actorRole === 'owner') return ROLE_ORDER;
  if (actorRole === 'admin') return ROLE_ORDER.filter((r) => r !== 'owner');
  return [];
}
