/** Set on every create/update; the sync engine pushes records newer than the last sync. */
export interface Syncable {
  updatedAt?: string; // full ISO timestamp
}

/** Tombstone recording a local delete so it can be replayed against the server. */
export interface DeletionRecord {
  entity:
    | 'organization'
    | 'user'
    | 'membership'
    | 'property'
    | 'unit'
    | 'appliance'
    | 'log'
    | 'schedule'
    | 'plan'
    | 'subscription';
  id: string;
  deletedAt: string; // full ISO timestamp
}

/** A pricing tier, configured by the platform owner. */
export interface Plan extends Syncable {
  id: string;
  name: string;
  /** 0 = free tier. */
  yearlyPrice: number;
  /** Property limit; undefined = unlimited. */
  maxProperties?: number;
  /** Trial length when a company starts on this plan; 0 = no trial. */
  trialDays: number;
  createdAt: string;
}

/** A company's subscription to a plan. One per organization. */
export interface Subscription extends Syncable {
  id: string;
  orgId: string;
  planId: string;
  status: 'trial' | 'active';
  startedAt: string; // YYYY-MM-DD
  trialEndsAt?: string; // YYYY-MM-DD, for trials
  currentPeriodEnd?: string; // YYYY-MM-DD, for paid yearly subscriptions
}

export type ApplianceType =
  | 'refrigerator'
  | 'hvac'
  | 'water-heater'
  | 'dishwasher'
  | 'washer'
  | 'dryer'
  | 'oven-range'
  | 'microwave'
  | 'garbage-disposal'
  | 'other';

export type Role = 'owner' | 'admin' | 'manager' | 'technician' | 'viewer' | 'investor';

export interface Organization extends Syncable {
  id: string;
  name: string;
  createdAt: string;
}

export interface User extends Syncable {
  id: string;
  name: string;
  email: string;
  /**
   * The software operator: onboards companies onto the platform and has
   * oversight of all of them. Not a member of any company by default.
   */
  isPlatformAdmin?: boolean;
  createdAt: string;
}

/** Links a user to an organization with a role. A user can belong to many orgs. */
export interface Membership extends Syncable {
  id: string;
  orgId: string;
  userId: string;
  role: Role;
  /**
   * Property-level access control: when set, the member sees ONLY these
   * properties (e.g. an investor who owns two buildings, or a technician
   * assigned to specific sites). Undefined (and no unitIds) = all org properties.
   */
  propertyIds?: string[];
  /**
   * Unit-level access control: grants access to specific units (e.g. a condo
   * investor who owns one unit). Implies visibility of the parent property and
   * its building/common appliances, but not of other units.
   */
  unitIds?: string[];
}

export interface Session {
  currentUserId: string | null;
  currentOrgId: string | null;
}

/** Contact details of an individual owner/investor. */
export interface OwnerContact {
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerMailingAddress?: string;
}

export interface Property extends OwnerContact, Syncable {
  id: string;
  orgId: string;
  name: string;
  address: string;
  notes?: string;
  createdAt: string; // ISO date
}

/**
 * A rentable unit inside a property (e.g. "Unit 2B"). In a condominium
 * complex each unit can carry its own owner contact.
 */
export interface Unit extends OwnerContact, Syncable {
  id: string;
  propertyId: string;
  name: string;
  notes?: string;
  createdAt: string;
}

export interface Appliance extends Syncable {
  id: string;
  propertyId: string;
  /** Unit the appliance lives in; undefined = building / common area. */
  unitId?: string;
  name: string;
  type: ApplianceType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string; // YYYY-MM-DD
  purchasePrice?: number;
  warrantyExpiry?: string; // YYYY-MM-DD
  warrantyProvider?: string;
  notes?: string;
  createdAt: string;
}

export type LogType = 'repair' | 'maintenance' | 'inspection' | 'replacement';

export interface MaintenanceLog extends Syncable {
  id: string;
  applianceId: string;
  date: string; // YYYY-MM-DD
  type: LogType;
  description: string;
  cost?: number;
  vendor?: string;
}

export interface Schedule extends Syncable {
  id: string;
  applianceId: string;
  title: string;
  intervalMonths: number;
  lastDone: string; // YYYY-MM-DD - interval counts from this date
}

export interface ScheduleWithDue extends Schedule {
  nextDue: string; // YYYY-MM-DD
  daysUntilDue: number; // negative = overdue
  applianceName: string;
  propertyId: string;
  propertyName: string;
  unitName?: string;
}
