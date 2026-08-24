const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's local date as YYYY-MM-DD. */
export function today(): string {
  return toISODate(new Date());
}

/** Full ISO timestamp — used to stamp changes for sync. */
export function nowISO(): string {
  return new Date().toISOString();
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as a local-time date (avoids UTC off-by-one). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return !Number.isNaN(d.getTime()) && toISODate(d) === s;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function addMonths(iso: string, months: number): string {
  const d = parseISODate(iso);
  const targetDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, daysInMonth));
  return toISODate(d);
}

/** Whole days from today until the given date (negative = past). */
export function daysUntil(iso: string): number {
  const a = parseISODate(today()).getTime();
  const b = parseISODate(iso).getTime();
  return Math.round((b - a) / DAY_MS);
}

/** Whole years elapsed since the given date. */
export function yearsSince(iso: string): number {
  return Math.max(0, -daysUntil(iso)) / 365.25;
}

export function formatDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Human-friendly relative due phrase: "5 days overdue", "due today", "due in 12 days". */
export function duePhrase(daysUntilDue: number): string {
  if (daysUntilDue < 0) {
    const n = -daysUntilDue;
    return n === 1 ? '1 day overdue' : `${n} days overdue`;
  }
  if (daysUntilDue === 0) return 'due today';
  if (daysUntilDue === 1) return 'due tomorrow';
  if (daysUntilDue < 60) return `due in ${daysUntilDue} days`;
  const months = Math.round(daysUntilDue / 30.4);
  return `due in ${months} months`;
}
