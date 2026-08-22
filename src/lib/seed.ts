import { addMonths, today } from './dates';
import type {
  Appliance,
  MaintenanceLog,
  Membership,
  Organization,
  Property,
  Schedule,
  Session,
  Unit,
  User,
} from './types';

/**
 * Demo dataset with dates anchored to "today" so the dashboard always shows a
 * realistic mix of overdue, due-soon, and future items. Includes two companies
 * and a user in every role so multi-tenant behavior can be explored.
 */
export function buildSeedData(): {
  organizations: Organization[];
  users: User[];
  memberships: Membership[];
  session: Session;
  properties: Property[];
  units: Unit[];
  appliances: Appliance[];
  logs: MaintenanceLog[];
  schedules: Schedule[];
} {
  const t = today();
  const monthsAgo = (n: number) => addMonths(t, -n);
  const monthsAhead = (n: number) => addMonths(t, n);

  const organizations: Organization[] = [
    { id: 'org-acme', name: 'Acme Property Management', createdAt: monthsAgo(24) },
    { id: 'org-bluedoor', name: 'Blue Door Rentals', createdAt: monthsAgo(6) },
  ];

  const users: User[] = [
    {
      id: 'user-platform',
      name: 'Platform Owner (you)',
      email: 'you@platform.test',
      isPlatformAdmin: true,
      createdAt: monthsAgo(30),
    },
    { id: 'user-alice', name: 'Alice Okafor', email: 'alice@acmepm.test', createdAt: monthsAgo(24) },
    { id: 'user-ben', name: 'Ben Reyes', email: 'ben@acmepm.test', createdAt: monthsAgo(20) },
    { id: 'user-carlos', name: 'Carlos Nguyen', email: 'carlos@acmepm.test', createdAt: monthsAgo(15) },
    { id: 'user-tina', name: 'Tina Volkov', email: 'tina@acmepm.test', createdAt: monthsAgo(10) },
    { id: 'user-vera', name: 'Vera Lindqvist', email: 'vera@acmepm.test', createdAt: monthsAgo(3) },
    { id: 'user-ivan', name: 'Ivan Petrov', email: 'ivan.investor@gmail.test', createdAt: monthsAgo(18) },
    { id: 'user-maria', name: 'Maria Gomez', email: 'maria.gomez@investmail.test', createdAt: monthsAgo(12) },
  ];

  const memberships: Membership[] = [
    { id: 'mem-1', orgId: 'org-acme', userId: 'user-alice', role: 'owner' },
    { id: 'mem-2', orgId: 'org-acme', userId: 'user-ben', role: 'admin' },
    { id: 'mem-3', orgId: 'org-acme', userId: 'user-carlos', role: 'manager' },
    { id: 'mem-4', orgId: 'org-acme', userId: 'user-tina', role: 'technician' },
    { id: 'mem-5', orgId: 'org-acme', userId: 'user-vera', role: 'viewer' },
    // Ivan owns the Maple St Duplex — Acme manages it for him. He sees only that property.
    { id: 'mem-7', orgId: 'org-acme', userId: 'user-ivan', role: 'investor', propertyIds: ['prop-maple'] },
    // Maria owns condo Unit 101 at Cedar Court — she sees only her unit (plus shared building appliances).
    { id: 'mem-8', orgId: 'org-acme', userId: 'user-maria', role: 'investor', unitIds: ['unit-cedar-101'] },
    { id: 'mem-6', orgId: 'org-bluedoor', userId: 'user-alice', role: 'owner' },
  ];

  const session: Session = { currentUserId: 'user-platform', currentOrgId: 'org-acme' };

  const properties: Property[] = [
    {
      id: 'prop-maple',
      orgId: 'org-acme',
      name: 'Maple St Duplex',
      address: '412 Maple St, Springfield',
      notes: 'Two units, tenants: Unit A — Jordan, Unit B — Priya.',
      ownerName: 'Ivan Petrov',
      ownerPhone: '+1 (555) 210-3348',
      ownerEmail: 'ivan.investor@gmail.test',
      ownerMailingAddress: '2200 Lakeshore Blvd Apt 14, Capital City, 62701',
      createdAt: monthsAgo(18),
    },
    {
      id: 'prop-oak',
      orgId: 'org-acme',
      name: 'Oakview Condo',
      address: '88 Oakview Dr #302, Springfield',
      ownerName: 'Chen Wei',
      ownerPhone: '+1 (555) 887-4102',
      ownerEmail: 'chen.wei@investmail.test',
      ownerMailingAddress: 'PO Box 918, Springfield, 62702',
      createdAt: monthsAgo(9),
    },
    {
      id: 'prop-cedar',
      orgId: 'org-acme',
      name: 'Cedar Court Condos',
      address: '5 Cedar Ct, Springfield',
      notes: 'Condominium complex — each unit individually owned; Acme manages units 101 and 204.',
      createdAt: monthsAgo(12),
    },
    {
      id: 'prop-birch',
      orgId: 'org-bluedoor',
      name: 'Birch Lane House',
      address: '17 Birch Ln, Shelbyville',
      notes: 'Single-family rental managed under Blue Door.',
      ownerName: 'Alice Okafor',
      ownerEmail: 'alice@acmepm.test',
      createdAt: monthsAgo(6),
    },
  ];

  const units: Unit[] = [
    {
      id: 'unit-maple-a',
      propertyId: 'prop-maple',
      name: 'Unit A',
      notes: 'Tenant: Jordan',
      createdAt: monthsAgo(18),
    },
    {
      id: 'unit-maple-b',
      propertyId: 'prop-maple',
      name: 'Unit B',
      notes: 'Tenant: Priya',
      createdAt: monthsAgo(18),
    },
    {
      id: 'unit-cedar-101',
      propertyId: 'prop-cedar',
      name: 'Unit 101',
      notes: 'Tenant: Marcus',
      ownerName: 'Maria Gomez',
      ownerPhone: '+1 (555) 640-2211',
      ownerEmail: 'maria.gomez@investmail.test',
      ownerMailingAddress: '48 Harborview Rd, Capital City, 62704',
      createdAt: monthsAgo(12),
    },
    {
      id: 'unit-cedar-204',
      propertyId: 'prop-cedar',
      name: 'Unit 204',
      ownerName: "Sam O'Neil",
      ownerPhone: '+1 (555) 233-9087',
      ownerEmail: 'sam.oneil@investmail.test',
      ownerMailingAddress: '910 Prairie Ave, Shelbyville, 62565',
      createdAt: monthsAgo(11),
    },
  ];

  const appliances: Appliance[] = [
    {
      id: 'app-fridge-a',
      propertyId: 'prop-maple',
      unitId: 'unit-maple-a',
      name: 'Kitchen refrigerator',
      type: 'refrigerator',
      brand: 'Whirlpool',
      model: 'WRF535SWHZ',
      serialNumber: 'WH8834021',
      purchaseDate: monthsAgo(30),
      warrantyExpiry: monthsAhead(2),
      warrantyProvider: 'Whirlpool factory warranty',
      createdAt: monthsAgo(18),
    },
    {
      id: 'app-hvac-a',
      propertyId: 'prop-maple',
      name: 'Central HVAC',
      type: 'hvac',
      brand: 'Carrier',
      model: 'Infinity 24',
      purchaseDate: monthsAgo(150),
      notes: 'Serves both units. Filter size 20x25x1.',
      createdAt: monthsAgo(18),
    },
    {
      id: 'app-wh-a',
      propertyId: 'prop-maple',
      name: 'Water heater (basement)',
      type: 'water-heater',
      brand: 'Rheem',
      model: 'XE50M06ST45U1',
      purchaseDate: monthsAgo(110),
      warrantyExpiry: monthsAgo(14),
      warrantyProvider: 'Rheem 6-year',
      createdAt: monthsAgo(18),
    },
    {
      id: 'app-washer-b',
      propertyId: 'prop-maple',
      unitId: 'unit-maple-b',
      name: 'Washer',
      type: 'washer',
      brand: 'LG',
      model: 'WM4000HWA',
      purchaseDate: monthsAgo(8),
      warrantyExpiry: monthsAhead(4),
      warrantyProvider: 'LG 1-year parts & labor',
      createdAt: monthsAgo(8),
    },
    {
      id: 'app-dw-oak',
      propertyId: 'prop-oak',
      name: 'Dishwasher',
      type: 'dishwasher',
      brand: 'Bosch',
      model: 'SHXM4AY55N',
      serialNumber: 'BO552198',
      purchaseDate: monthsAgo(4),
      warrantyExpiry: monthsAhead(8),
      warrantyProvider: 'Bosch 1-year',
      createdAt: monthsAgo(4),
    },
    {
      id: 'app-dryer-oak',
      propertyId: 'prop-oak',
      name: 'Dryer',
      type: 'dryer',
      brand: 'Samsung',
      model: 'DVE45R6100C',
      purchaseDate: monthsAgo(70),
      createdAt: monthsAgo(9),
    },
    {
      id: 'app-fridge-cedar101',
      propertyId: 'prop-cedar',
      unitId: 'unit-cedar-101',
      name: 'Refrigerator',
      type: 'refrigerator',
      brand: 'GE',
      model: 'GNE27JYMFS',
      purchaseDate: monthsAgo(20),
      warrantyExpiry: monthsAgo(8),
      createdAt: monthsAgo(12),
    },
    {
      id: 'app-dw-cedar204',
      propertyId: 'prop-cedar',
      unitId: 'unit-cedar-204',
      name: 'Dishwasher',
      type: 'dishwasher',
      brand: 'Whirlpool',
      model: 'WDF520PADM',
      purchaseDate: monthsAgo(15),
      createdAt: monthsAgo(11),
    },
    {
      id: 'app-wh-birch',
      propertyId: 'prop-birch',
      name: 'Water heater (garage)',
      type: 'water-heater',
      brand: 'AO Smith',
      model: 'G6-UT5040NVR',
      purchaseDate: monthsAgo(26),
      warrantyExpiry: monthsAhead(46),
      warrantyProvider: 'AO Smith 6-year',
      createdAt: monthsAgo(6),
    },
  ];

  const schedules: Schedule[] = [
    { id: 'sch-1', applianceId: 'app-fridge-a', title: 'Replace water filter', intervalMonths: 6, lastDone: monthsAgo(7) },
    { id: 'sch-2', applianceId: 'app-fridge-a', title: 'Clean condenser coils', intervalMonths: 12, lastDone: monthsAgo(5) },
    { id: 'sch-3', applianceId: 'app-hvac-a', title: 'Replace air filter', intervalMonths: 3, lastDone: monthsAgo(4) },
    { id: 'sch-4', applianceId: 'app-hvac-a', title: 'Professional service & tune-up', intervalMonths: 12, lastDone: monthsAgo(11) },
    { id: 'sch-5', applianceId: 'app-wh-a', title: 'Flush tank & check anode rod', intervalMonths: 12, lastDone: monthsAgo(6) },
    { id: 'sch-6', applianceId: 'app-washer-b', title: 'Clean drum & detergent tray', intervalMonths: 3, lastDone: monthsAgo(2) },
    { id: 'sch-7', applianceId: 'app-dw-oak', title: 'Clean filter & spray arms', intervalMonths: 3, lastDone: monthsAgo(3) },
    { id: 'sch-8', applianceId: 'app-dryer-oak', title: 'Clean exhaust vent & duct', intervalMonths: 12, lastDone: monthsAgo(13) },
    { id: 'sch-9', applianceId: 'app-wh-birch', title: 'Flush tank & check anode rod', intervalMonths: 12, lastDone: monthsAgo(10) },
    { id: 'sch-10', applianceId: 'app-fridge-cedar101', title: 'Replace water filter', intervalMonths: 6, lastDone: monthsAgo(5) },
    { id: 'sch-11', applianceId: 'app-dw-cedar204', title: 'Clean filter & spray arms', intervalMonths: 3, lastDone: monthsAgo(4) },
  ];

  const logs: MaintenanceLog[] = [
    {
      id: 'log-1',
      applianceId: 'app-hvac-a',
      date: monthsAgo(11),
      type: 'maintenance',
      description: 'Annual service — refrigerant topped up, coils cleaned.',
      cost: 189,
      vendor: 'Springfield Heating & Air',
    },
    {
      id: 'log-2',
      applianceId: 'app-hvac-a',
      date: monthsAgo(4),
      type: 'maintenance',
      description: 'Replaced air filter (20x25x1 MERV 11).',
      cost: 14,
    },
    {
      id: 'log-3',
      applianceId: 'app-fridge-a',
      date: monthsAgo(7),
      type: 'maintenance',
      description: 'Replaced water filter (EDR1RXD1).',
      cost: 42,
    },
    {
      id: 'log-4',
      applianceId: 'app-wh-a',
      date: monthsAgo(6),
      type: 'repair',
      description: 'Replaced thermocouple — pilot light kept going out.',
      cost: 145,
      vendor: 'ProPlumb LLC',
    },
    {
      id: 'log-5',
      applianceId: 'app-dw-oak',
      date: monthsAgo(1),
      type: 'inspection',
      description: 'Tenant reported rattle — spray arm was loose, re-seated.',
      cost: 0,
    },
    {
      id: 'log-6',
      applianceId: 'app-dryer-oak',
      date: monthsAgo(13),
      type: 'maintenance',
      description: 'Vent duct cleaned, airflow restored.',
      cost: 95,
      vendor: 'DuctPros',
    },
  ];

  return { organizations, users, memberships, session, properties, units, appliances, logs, schedules };
}
