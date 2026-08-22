import type { ApplianceType } from './types';

export interface ApplianceTypeInfo {
  label: string;
  emoji: string;
  /** Typical useful life in years, used for replacement planning. */
  lifespanYears: number;
  /** Recommended recurring maintenance, auto-added when creating an appliance. */
  defaultSchedules: { title: string; intervalMonths: number }[];
}

export const APPLIANCE_TYPES: Record<ApplianceType, ApplianceTypeInfo> = {
  refrigerator: {
    label: 'Refrigerator',
    emoji: '🧊',
    lifespanYears: 13,
    defaultSchedules: [
      { title: 'Replace water filter', intervalMonths: 6 },
      { title: 'Clean condenser coils', intervalMonths: 12 },
    ],
  },
  hvac: {
    label: 'HVAC',
    emoji: '❄️',
    lifespanYears: 15,
    defaultSchedules: [
      { title: 'Replace air filter', intervalMonths: 3 },
      { title: 'Professional service & tune-up', intervalMonths: 12 },
    ],
  },
  'water-heater': {
    label: 'Water heater',
    emoji: '🔥',
    lifespanYears: 10,
    defaultSchedules: [
      { title: 'Flush tank & check anode rod', intervalMonths: 12 },
      { title: 'Test pressure relief valve', intervalMonths: 12 },
    ],
  },
  dishwasher: {
    label: 'Dishwasher',
    emoji: '🍽️',
    lifespanYears: 10,
    defaultSchedules: [
      { title: 'Clean filter & spray arms', intervalMonths: 3 },
      { title: 'Inspect door seal & hoses', intervalMonths: 12 },
    ],
  },
  washer: {
    label: 'Washing machine',
    emoji: '🌀',
    lifespanYears: 11,
    defaultSchedules: [
      { title: 'Clean drum & detergent tray', intervalMonths: 3 },
      { title: 'Inspect supply hoses', intervalMonths: 12 },
    ],
  },
  dryer: {
    label: 'Dryer',
    emoji: '🌬️',
    lifespanYears: 13,
    defaultSchedules: [
      { title: 'Clean exhaust vent & duct', intervalMonths: 12 },
      { title: 'Deep-clean lint trap area', intervalMonths: 6 },
    ],
  },
  'oven-range': {
    label: 'Oven / range',
    emoji: '🍳',
    lifespanYears: 15,
    defaultSchedules: [{ title: 'Deep clean & check burners/elements', intervalMonths: 6 }],
  },
  microwave: {
    label: 'Microwave',
    emoji: '📡',
    lifespanYears: 9,
    defaultSchedules: [{ title: 'Clean & replace grease filter', intervalMonths: 6 }],
  },
  'garbage-disposal': {
    label: 'Garbage disposal',
    emoji: '🗑️',
    lifespanYears: 10,
    defaultSchedules: [{ title: 'Flush & deodorize', intervalMonths: 3 }],
  },
  other: {
    label: 'Other',
    emoji: '🔧',
    lifespanYears: 10,
    defaultSchedules: [],
  },
};

export const APPLIANCE_TYPE_ORDER: ApplianceType[] = [
  'refrigerator',
  'hvac',
  'water-heater',
  'dishwasher',
  'washer',
  'dryer',
  'oven-range',
  'microwave',
  'garbage-disposal',
  'other',
];
