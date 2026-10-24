import { describe, expect, it } from 'vitest';
import { latestSlot, needsCatchUp, nextSlot, SCRAPE_CRON_UTC, slotId, slotNear, slotTime } from '../src/slots';

const ist = (s: string) => new Date(`${s}+05:30`);

describe('scrape slots (02:00 and 14:00 IST)', () => {
  it('names slots in India time', () => {
    expect(slotId(ist('2026-10-25T02:00:00'))).toBe('2026-10-25T02:00+05:30');
    expect(slotId(new Date('2026-10-25T08:30:00Z'))).toBe('2026-10-25T14:00+05:30');
    expect(slotTime('2026-10-25T02:00+05:30')?.toISOString()).toBe('2026-10-24T20:30:00.000Z');
    expect(slotTime('nonsense')).toBeUndefined();
  });

  it('finds the latest and next slot, across midnight', () => {
    expect(slotId(latestSlot(ist('2026-10-24T18:21:00')))).toBe('2026-10-24T14:00+05:30');
    expect(slotId(nextSlot(ist('2026-10-24T18:21:00')))).toBe('2026-10-25T02:00+05:30');
    expect(slotId(latestSlot(ist('2026-10-25T01:59:59')))).toBe('2026-10-24T14:00+05:30');
    expect(slotId(latestSlot(ist('2026-10-25T02:00:00')))).toBe('2026-10-25T02:00+05:30');
    expect(slotId(nextSlot(ist('2026-10-25T02:00:00')))).toBe('2026-10-25T14:00+05:30');
    // Year end.
    expect(slotId(nextSlot(ist('2026-12-31T23:00:00')))).toBe('2027-01-01T02:00+05:30');
  });

  it('matches a late cron call to its slot, and not an off-schedule one', () => {
    expect(slotNear(ist('2026-10-25T02:07:00'))).toBe('2026-10-25T02:00+05:30');
    expect(slotNear(ist('2026-10-25T03:20:00'))).toBe('2026-10-25T02:00+05:30');
    expect(slotNear(ist('2026-10-25T05:00:00'))).toBeUndefined();
  });

  it('catches up only when nothing ran since the last slot and the next one is not close', () => {
    const now = ist('2026-10-24T18:21:00');
    expect(needsCatchUp(now, undefined)).toBe(true);
    expect(needsCatchUp(now, ist('2026-10-24T09:00:00'))).toBe(true);
    expect(needsCatchUp(now, ist('2026-10-24T14:00:05'))).toBe(false);
    // 01:30: the 02:00 slot is half an hour away, so wait for it.
    expect(needsCatchUp(ist('2026-10-25T01:30:00'), ist('2026-10-24T09:00:00'))).toBe(false);
  });

  it('has the Vercel cron times in UTC', () => {
    expect(SCRAPE_CRON_UTC).toEqual(['30 20 * * *', '30 8 * * *']);
  });
});
