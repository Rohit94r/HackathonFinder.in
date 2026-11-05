import type { Currency, Hackathon, Status } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Deadline within this many days counts as "closing soon". */
export const CLOSING_SOON_DAYS = 3;

/**
 * Rough rate used only to compare, sort and filter INR and USD prizes. What visitors see is converted
 * at the day's rate (apps/web/src/lib/currency.ts).
 */
export const APPROX_INR_PER_USD = 94;

export function computeStatus(h: Pick<Hackathon, 'startDate' | 'endDate' | 'registrationDeadline'>, now: Date): Status {
  const t = now.getTime();
  const start = Date.parse(h.startDate);
  const end = Date.parse(h.endDate);
  const deadline = Date.parse(h.registrationDeadline);

  if (t > end) return 'completed';
  if (t >= start) return 'in-progress';
  if (t > deadline) return 'registration-closed';
  if (deadline - t <= CLOSING_SOON_DAYS * DAY_MS) return 'closing-soon';
  return 'open';
}

/** Whole days from now until the deadline (0 = today, negative = passed). */
export function daysUntil(iso: string, now: Date): number {
  return Math.ceil((Date.parse(iso) - now.getTime()) / DAY_MS);
}

export function isRegistrationOpen(status: Status): boolean {
  return status === 'open' || status === 'closing-soon';
}

export function prizeInInr(amount: number, currency: Currency): number {
  return currency === 'USD' ? amount * APPROX_INR_PER_USD : amount;
}
