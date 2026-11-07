import type { Currency, Hackathon, Status } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60_000;

/** Deadline within this many calendar days (India time) counts as "closing soon". */
export const CLOSING_SOON_DAYS = 7;

/**
 * Rough rate used only to compare, sort and filter INR and USD prizes. What visitors see is converted
 * at the day's rate (apps/web/src/lib/currency.ts).
 */
export const APPROX_INR_PER_USD = 94;

/**
 * The calendar day (India time) an instant falls on, as a UTC midnight timestamp.
 * Comparing these gives whole calendar days, so a deadline tomorrow evening is
 * "tomorrow" even when it is less than 24 hours away.
 */
function istDay(iso: string | Date): number {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return Number.NaN;
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
}

export function computeStatus(h: Pick<Hackathon, 'startDate' | 'endDate' | 'registrationDeadline'>, now: Date): Status {
  const t = now.getTime();
  const start = Date.parse(h.startDate);
  const end = Date.parse(h.endDate);
  const deadline = Date.parse(h.registrationDeadline);

  if (t > end) return 'completed';
  if (t >= start) return 'in-progress';
  if (t > deadline) return 'registration-closed';
  if (daysUntil(h.registrationDeadline, now) <= CLOSING_SOON_DAYS) return 'closing-soon';
  return 'open';
}

/**
 * Whole calendar days (India time) from now until the deadline: 0 = today,
 * 1 = tomorrow, negative = passed. Calendar days, not 24-hour blocks, so the
 * label agrees with the date shown on the ticket.
 */
export function daysUntil(iso: string, now: Date): number {
  const target = istDay(iso);
  const today = istDay(now);
  if (Number.isNaN(target) || Number.isNaN(today)) return 0;
  return Math.round((target - today) / DAY_MS);
}

/** Whole calendar days from now until any instant (0 = today, 1 = tomorrow). */
export function calendarDaysUntil(date: Date, now: Date): number {
  const target = istDay(date);
  const today = istDay(now);
  if (Number.isNaN(target) || Number.isNaN(today)) return 0;
  return Math.round((target - today) / DAY_MS);
}

export function isRegistrationOpen(status: Status): boolean {
  return status === 'open' || status === 'closing-soon';
}

export function prizeInInr(amount: number, currency: Currency): number {
  return currency === 'USD' ? amount * APPROX_INR_PER_USD : amount;
}
