// When scheduled scrapes run: 02:00 and 14:00 India time, every day. Each time is a
// "slot" with a stable id ("2026-10-25T02:00+05:30"); AgentRun.slot is unique, so
// one slot runs once even when the website's timer, Vercel Cron and the agents
// worker all fire for it.

export const SCRAPE_TIMES = ['02:00', '14:00'] as const;
export const SCRAPE_TIMEZONE = 'Asia/Kolkata';
/** node-cron expression, read in Asia/Kolkata. */
export const SCRAPE_CRON = '0 2,14 * * *';
/** Vercel Cron runs in UTC: 20:30 and 08:30 UTC are 02:00 and 14:00 IST. */
export const SCRAPE_CRON_UTC = ['30 20 * * *', '30 8 * * *'];

/** India has no daylight saving: IST is always UTC+05:30. */
const IST_OFFSET_MS = 330 * 60_000;
const HOUR = 3600_000;
const SLOT_HOURS = SCRAPE_TIMES.map((t) => Number(t.slice(0, 2)));

/** "2026-10-25T02:00+05:30" for the slot starting at `at` (an exact slot time). */
export function slotId(at: Date): string {
  const ist = new Date(at.getTime() + IST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}+05:30`;
}

/** The instant a slot id stands for. */
export function slotTime(id: string): Date | undefined {
  const m = id.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})\+05:30$/);
  if (!m) return undefined;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - IST_OFFSET_MS);
}

function slotsAround(now: Date): Date[] {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const midnightIst = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS;
  const out: Date[] = [];
  for (const day of [-1, 0, 1]) for (const h of SLOT_HOURS) out.push(new Date(midnightIst + day * 24 * HOUR + h * HOUR));
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** The most recent slot time at or before `now`. */
export function latestSlot(now: Date): Date {
  return slotsAround(now).filter((s) => s.getTime() <= now.getTime()).pop()!;
}

/** The next slot time after `now`. */
export function nextSlot(now: Date): Date {
  return slotsAround(now).find((s) => s.getTime() > now.getTime())!;
}

/**
 * The slot a scheduled call belongs to: the latest slot when it began at most
 * `toleranceMs` ago (cron services can be late), else undefined (an off-schedule call).
 */
export function slotNear(now: Date, toleranceMs = 90 * 60_000): string | undefined {
  const s = latestSlot(now);
  return now.getTime() - s.getTime() <= toleranceMs ? slotId(s) : undefined;
}

/**
 * Whether a server that just started should catch up on a missed slot: nothing ran
 * since the latest slot, and the next one is more than an hour away (so it isn't
 * about to run anyway).
 */
export function needsCatchUp(now: Date, lastRunStartedAt: Date | undefined): boolean {
  const latest = latestSlot(now);
  if (lastRunStartedAt && lastRunStartedAt.getTime() >= latest.getTime()) return false;
  return nextSlot(now).getTime() - now.getTime() > HOUR;
}
