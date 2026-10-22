// Date parsing for event pages and platform feeds. Indian sources rarely give a
// timezone, so anything without an offset is read as India time (IST, +05:30).

export const IST = 'Asia/Kolkata';

/** What the date is for: a missing time defaults to 09:00 for starts, 18:00 for ends and 23:59 for deadlines. */
export type DateKind = 'start' | 'end' | 'deadline';

const DEFAULT_TIME: Record<DateKind, [number, number]> = { start: [9, 0], end: [18, 0], deadline: [23, 59] };

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';
const DAY_FIRST = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?[\\s\\-/.,]*${MONTH}(?:[\\s\\-/.,']+(\\d{4}))?`, 'i');
const MONTH_FIRST = new RegExp(`\\b${MONTH}[\\s\\-/.,]*(\\d{1,2})(?:st|nd|rd|th)?\\b(?:[\\s,]+(\\d{4}))?`, 'i');
const MONTH_ANY = new RegExp(`\\b${MONTH}`, 'i');

export interface DateOptions {
  kind?: DateKind;
  /** Zone for times without an offset. Defaults to Asia/Kolkata. */
  timeZone?: string;
  /** For dates without a year: the next occurrence after this. */
  now?: Date;
}

function validZone(tz: string | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const formats = new Map<string, Intl.DateTimeFormat>();

/** Minutes the zone is ahead of UTC at that instant (330 for IST). */
function offsetMinutes(utcMs: number, timeZone: string): number {
  let f = formats.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formats.set(timeZone, f);
  }
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60_000);
}

/** A wall-clock time in a zone ("14 Nov 2026, 09:00 in India") as an absolute Date. */
export function zonedTime(y: number, month: number, d: number, h = 0, mi = 0, s = 0, timeZone = IST): Date | undefined {
  const check = new Date(Date.UTC(y, month - 1, d));
  if (month < 1 || month > 12 || d < 1 || check.getUTCDate() !== d || check.getUTCMonth() !== month - 1) return undefined;
  if (h > 23 || mi > 59 || s > 59) return undefined;
  const guess = Date.UTC(y, month - 1, d, h, mi, s);
  const off = offsetMinutes(guess, timeZone);
  let t = guess - off * 60_000;
  // Around a DST change the offset at the result can differ from the guess; one correction is enough.
  const off2 = offsetMinutes(t, timeZone);
  if (off2 !== off) t = guess - off2 * 60_000;
  return new Date(t);
}

/** Calendar date (y, m, d) of an instant in a zone. */
export function zonedParts(date: Date, timeZone = IST): { y: number; m: number; d: number } {
  const local = new Date(date.getTime() + offsetMinutes(date.getTime(), timeZone) * 60_000);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate() };
}

/**
 * Reads a date from a feed or page: Date objects, epoch numbers, ISO 8601 (with or
 * without an offset), and the human forms Indian sites use ("05 Nov 2026, 11:59 PM IST",
 * "Oct 05, 2026 08:00 PM IST (Asia/Kolkata)", "23rd October", "23/10/2026").
 */
export function parseDate(input: unknown, opts: DateOptions = {}): Date | undefined {
  if (input === null || input === undefined || input === '') return undefined;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? undefined : input;
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input <= 0) return undefined;
    return new Date(input < 1e12 ? input * 1000 : input);
  }
  if (typeof input !== 'string') return undefined;
  const s = input.trim().replace(/\s+/g, ' ');
  const kind = opts.kind ?? 'start';
  const tz = validZone(opts.timeZone) ? opts.timeZone : IST;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2}|(?:GMT|UTC) ?[+-]\d{2}:?\d{2})?$/i);
  if (iso) {
    const [, y, mo, d, h, mi, sec, off] = iso;
    if (off) {
      const zone = off.toUpperCase() === 'Z' ? 'Z' : off.replace(/^(GMT|UTC) ?/i, '').replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
      const t = Date.parse(`${y}-${mo}-${d}T${h ?? '00'}:${mi ?? '00'}:${sec ?? '00'}${zone}`);
      return Number.isNaN(t) ? undefined : new Date(t);
    }
    if (h !== undefined) return zonedTime(+y, +mo, +d, +h, +mi, +(sec ?? 0), tz);
    const [dh, dm] = DEFAULT_TIME[kind];
    return zonedTime(+y, +mo, +d, dh, dm, 0, tz);
  }
  return parseHumanDate(s, kind, tz, opts.now ?? new Date());
}

function parseHumanDate(s: string, kind: DateKind, defaultTz: string, now: Date): Date | undefined {
  let tz = defaultTz;
  const iana = s.match(/\b([A-Z][a-z]+\/[A-Za-z_]+)\b/);
  if (iana && validZone(iana[1])) tz = iana[1];
  else if (/\b(utc|gmt)\b/i.test(s)) tz = 'UTC';
  else if (/\bist\b/i.test(s)) tz = IST;

  const t = s.toLowerCase().replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?/g, ' ');
  let y: number | undefined;
  let mo: number | undefined;
  let d: number | undefined;
  let rest = t;

  let m = t.match(DAY_FIRST);
  if (m) {
    d = +m[1];
    mo = MONTHS[m[2].slice(0, 3)];
    y = m[3] ? +m[3] : undefined;
  } else if ((m = t.match(MONTH_FIRST))) {
    mo = MONTHS[m[1].slice(0, 3)];
    d = +m[2];
    y = m[3] ? +m[3] : undefined;
  } else if ((m = t.match(/\b(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})\b/))) {
    y = +m[1];
    mo = +m[2];
    d = +m[3];
  } else if ((m = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/))) {
    const a = +m[1];
    const b = +m[2];
    // Indian sites write the day first; switch only when that can't be right.
    [d, mo] = b > 12 && a <= 12 ? [b, a] : [a, b];
    y = +m[3];
  } else {
    return undefined;
  }
  rest = t.replace(m[0], ' ');

  let h: number | undefined;
  let mi = 0;
  const ampm = rest.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/);
  if (ampm) {
    const hour = +ampm[1];
    if (hour >= 1 && hour <= 12) {
      h = (hour % 12) + (ampm[3].startsWith('p') ? 12 : 0);
      mi = ampm[2] ? +ampm[2] : 0;
    }
  } else {
    const h24 = rest.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/);
    if (h24) {
      h = +h24[1];
      mi = +h24[2];
    } else if (/\bnoon\b/.test(rest)) h = 12;
  }
  if (h === undefined) [h, mi] = DEFAULT_TIME[kind];

  if (y === undefined) {
    // No year: the next time this date comes round (a day's grace for "today").
    const { y: thisYear } = zonedParts(now, tz);
    const candidate = zonedTime(thisYear, mo!, d!, h, mi, 0, tz);
    if (!candidate) return undefined;
    y = candidate.getTime() < now.getTime() - 24 * 3600_000 ? thisYear + 1 : thisYear;
  }
  return zonedTime(y, mo!, d!, h, mi, 0, tz);
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

/**
 * Reads ranges like Devpost's "Aug 31 - Oct 23, 2026", "Oct 05 - 27, 2026",
 * "Dec 15, 2026 - Jan 10, 2027" or a single "Nov 28, 2026".
 */
export function parseDateRange(
  text: string | null | undefined,
  opts: { now?: Date; timeZone?: string; startKind?: DateKind; endKind?: DateKind } = {}
): DateRange {
  if (!text) return {};
  const s = text.trim().replace(/\s+/g, ' ');
  const startKind = opts.startKind ?? 'start';
  const endKind = opts.endKind ?? 'end';
  const base = { now: opts.now, timeZone: opts.timeZone };
  const parts = s.split(/\s+(?:-|–|—|to|till|until)\s+/i);
  if (parts.length < 2) {
    return { start: parseDate(s, { ...base, kind: startKind }), end: parseDate(s, { ...base, kind: endKind }) };
  }
  const [a, b] = parts;
  const yearA = a.match(/\b(\d{4})\b/)?.[1];
  const yearB = b.match(/\b(\d{4})\b/)?.[1];
  const monthA = a.match(MONTH_ANY)?.[0];
  const monthB = b.match(MONTH_ANY)?.[0];
  // The right side usually carries the year; a bare "27, 2026" borrows the left side's month.
  const right = !monthB && monthA ? `${monthA} ${b}` : b;
  const left = !yearA && yearB ? `${a} ${yearB}` : a;
  const end = parseDate(right, { ...base, kind: endKind });
  let start = parseDate(left, { ...base, kind: startKind });
  if (start && end && start > end && !yearA) {
    // "Dec 15 - Jan 10, 2027": the start is in the year before.
    const p = zonedParts(start, opts.timeZone ?? IST);
    const [h, mi] = DEFAULT_TIME[startKind];
    start = zonedTime(p.y - 1, p.m, p.d, h, mi, 0, opts.timeZone ?? IST);
  }
  return { start, end };
}

export function toIso(d: Date | undefined): string | undefined {
  return d ? d.toISOString() : undefined;
}

/** "22 Oct 2026, 10:30 IST" for logs and notes. */
export function formatIst(d: Date | undefined): string {
  if (!d) return '—';
  return `${d.toLocaleString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} IST`;
}
