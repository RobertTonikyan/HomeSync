// Date helpers working on local calendar days as 'YYYY-MM-DD' strings.

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function isISODate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86400000);
}

/** Week starts on Sunday (Israel). */
export function startOfWeek(iso: string): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() - d.getDay());
  return toISODate(d);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

const LOCALES: Record<string, string> = { he: 'he-IL', ru: 'ru-RU', en: 'en-GB' };

export function formatMonth(key: string, lang: string): string {
  const [y, m] = key.split('-').map(Number);
  try {
    return new Date(y, m - 1, 1).toLocaleDateString(LOCALES[lang] || 'en-GB', { month: 'long', year: 'numeric' });
  } catch {
    return key;
  }
}

export function formatDay(iso: string, lang: string): string {
  try {
    return parseISODate(iso).toLocaleDateString(LOCALES[lang] || 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

export function formatToday(lang: string): string {
  try {
    return new Date().toLocaleDateString(LOCALES[lang] || 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return todayISO();
  }
}
