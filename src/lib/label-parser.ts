import type { ApplianceType } from './types';

export interface ParsedLabel {
  brand?: string;
  model?: string;
  serialNumber?: string;
  applianceType?: ApplianceType;
  suggestedName?: string;
}

const KNOWN_BRANDS = [
  'Whirlpool', 'General Electric', 'GE', 'Samsung', 'LG', 'Bosch', 'Frigidaire',
  'Maytag', 'KitchenAid', 'Kenmore', 'Rheem', 'A.O. Smith', 'AO Smith',
  'Bradford White', 'Carrier', 'Trane', 'Lennox', 'Goodman', 'Amana',
  'Electrolux', 'Haier', 'Hisense', 'Miele', 'Speed Queen', 'InSinkErator',
  'Panasonic', 'Sharp', 'Toshiba', 'Danby', 'Hotpoint', 'Ruud', 'York',
  'Rinnai', 'Navien', 'Broan', 'Magic Chef', 'Summit', 'Avanti',
];

const TYPE_KEYWORDS: [RegExp, ApplianceType][] = [
  [/REFRIGERAT|FREEZER/i, 'refrigerator'],
  [/DISHWASH/i, 'dishwasher'],
  [/WASHING\s*MACHINE|\bWASHER\b|LAUNDRY/i, 'washer'],
  [/\bDRYER\b/i, 'dryer'],
  [/WATER\s*HEATER|\bBOILER\b/i, 'water-heater'],
  [/AIR\s*COND|HEAT\s*PUMP|FURNACE|\bHVAC\b|CONDENS/i, 'hvac'],
  [/\bRANGE\b|\bOVEN\b|COOKTOP|\bSTOVE\b/i, 'oven-range'],
  [/MICROWAVE/i, 'microwave'],
  [/DISPOSA?L|DISPOSER/i, 'garbage-disposal'],
];

/**
 * Heuristic extraction from raw OCR text of an appliance rating label.
 * Looks for MODEL/SERIAL keyword patterns and known brand names.
 */
export function parseLabelText(rawText: string): ParsedLabel {
  const text = rawText.replace(/[|]/g, 'I');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const result: ParsedLabel = {};

  const valueAfterKeyword = (line: string, keyword: RegExp): string | undefined => {
    const match = line.match(keyword);
    if (!match || match.index === undefined) return undefined;
    const rest = line.slice(match.index + match[0].length);
    // Take the first plausible alphanumeric token after the keyword.
    const token = rest.match(/[A-Z0-9][A-Z0-9./-]{3,24}/i);
    return token ? token[0].replace(/[.:]+$/, '') : undefined;
  };

  const MODEL_KEYWORD = /(?:MODEL\s*(?:NO|NUMBER|#)?|MOD\.?|M\/N)\s*[:#.\-]?\s*/i;
  const SERIAL_KEYWORD = /(?:SERIAL\s*(?:NO|NUMBER|#)?|SER\.?|S\/N)\s*[:#.\-]?\s*/i;

  for (const line of lines) {
    if (!result.model && !/SERIAL|S\/N/i.test(line.slice(0, 12))) {
      const v = valueAfterKeyword(line, MODEL_KEYWORD);
      // Reject tokens that are just the word NO/NUMBER fragments.
      if (v && !/^(NO|NUMBER)$/i.test(v)) result.model = v.toUpperCase();
    }
    if (!result.serialNumber) {
      const v = valueAfterKeyword(line, SERIAL_KEYWORD);
      if (v && !/^(NO|NUMBER)$/i.test(v)) result.serialNumber = v.toUpperCase();
    }
  }

  for (const brand of KNOWN_BRANDS) {
    const pattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) {
      result.brand = brand === 'AO Smith' ? 'A.O. Smith' : brand;
      break;
    }
  }

  for (const [pattern, type] of TYPE_KEYWORDS) {
    if (pattern.test(text)) {
      result.applianceType = type;
      break;
    }
  }

  if (result.brand || result.applianceType) {
    const typeLabel = result.applianceType ? result.applianceType.replace(/-/g, ' ') : 'appliance';
    result.suggestedName = [result.brand, typeLabel].filter(Boolean).join(' ');
  }

  return result;
}
