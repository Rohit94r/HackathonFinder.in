import { isCatalogCity } from './normalize';
import { missingKeyFields, type Draft } from './draft';

export type Validation = { ok: true } | { ok: false; reason: string; missing?: string[] };

const YEAR_MS = 365 * 24 * 3600_000;

/**
 * A listing needs a title, dates, a deadline, a registration link and a mode; it must
 * not be over, and an in-person event must be in India. New listings also need
 * registration to still be open. Fixes small problems in place (deadline after the end).
 */
export function validate(d: Draft, now: Date, opts: { isNew: boolean }): Validation {
  const missing = missingKeyFields(d);
  if (missing.length) return { ok: false, reason: `missing ${missing.join(', ')}`, missing };
  if (d.title.length < 3) return { ok: false, reason: 'title too short' };
  if (!/^https?:\/\//.test(d.registrationUrl!)) return { ok: false, reason: 'registration link is not a web link' };

  const start = d.startDate!.getTime();
  const end = d.endDate!.getTime();
  if (end < start) return { ok: false, reason: 'end date is before the start date' };
  if (d.registrationDeadline!.getTime() > end) {
    d.registrationDeadline = d.endDate;
    d.notes.push('deadline was after the end; set to the end date');
  }
  if (end < now.getTime()) return { ok: false, reason: 'event has already ended' };
  if (opts.isNew && d.registrationDeadline!.getTime() < now.getTime()) return { ok: false, reason: 'registration has already closed' };
  if (start > now.getTime() + 2 * YEAR_MS) return { ok: false, reason: 'start date is more than two years away (probably misread)' };
  if (end - start > YEAR_MS) d.flags.push('Runs for more than a year; check the dates');

  if (d.mode === 'offline') {
    if (d.country && !/^(india|bharat)$/i.test(d.country)) return { ok: false, reason: `in-person event outside India (${d.country})` };
    if (!d.city) d.flags.push('In-person event, but the city is not stated');
    else if (!d.country && !isCatalogCity(d.city)) d.flags.push('Check the location: the country is not stated');
  }
  return { ok: true };
}
