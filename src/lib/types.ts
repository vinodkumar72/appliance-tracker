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

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
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
export interface Membership {
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

export interface Property extends OwnerContact {
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
export interface Unit extends OwnerContact {
  id: string;
  propertyId: string;
  name: string;
  notes?: string;
  createdAt: string;
}

export interface Appliance {
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
  warrantyExpiry?: string; // YYYY-MM-DD
  warrantyProvider?: string;
  notes?: string;
  createdAt: string;
}

export type LogType = 'repair' | 'maintenance' | 'inspection' | 'replacement';

export interface MaintenanceLog {
  id: string;
  applianceId: string;
  date: string; // YYYY-MM-DD
  type: LogType;
  description: string;
  cost?: number;
  vendor?: string;
}

export interface Schedule {
  id: string;
  applianceId: string;
  title: string;
  intervalMonths: number;
  lastDone: string; // YYYY-MM-DD — interval counts from this date
}

export interface ScheduleWithDue extends Schedule {
  nextDue: string; // YYYY-MM-DD
  daysUntilDue: number; // negative = overdue
  applianceName: string;
  propertyId: string;
  propertyName: string;
  unitName?: string;
}
