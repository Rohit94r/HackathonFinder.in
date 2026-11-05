import { CITIES, THEMES, isRegistrationOpen, prizeInInr, type Hackathon, type Status } from '@hackathonfinder/shared';

// Types and pure helpers for listings, safe in client components. Loading listings
// happens on the server: see getHackathons in @/server/hackathons.

/** A listing plus the fields worked out at request time. */
export interface HackathonView extends Hackathon {
  status: Status;
  daysToDeadline: number;
}

export interface HackathonSnapshot {
  nowIso: string;
  items: HackathonView[];
}

/** Above this a stated prize pool is almost certainly a scraping error (a phone number, joined digits). */
export const MAX_PLAUSIBLE_PRIZE_INR = 10_00_00_000;

/** The prize pool in INR, or 0 when none is stated or the figure isn't believable. */
export function plausiblePrize(h: Pick<HackathonView, 'prizePool' | 'prizeCurrency'>): number {
  const inr = prizeInInr(h.prizePool, h.prizeCurrency);
  return inr > MAX_PLAUSIBLE_PRIZE_INR ? 0 : inr;
}

export function openOnly(items: HackathonView[]): HackathonView[] {
  return items.filter((h) => isRegistrationOpen(h.status));
}

export function byDeadline(a: HackathonView, b: HackathonView): number {
  return Date.parse(a.registrationDeadline) - Date.parse(b.registrationDeadline);
}

export function closingSoon(items: HackathonView[], limit = 4): HackathonView[] {
  return openOnly(items).sort(byDeadline).slice(0, limit);
}

export function similarTo(item: HackathonView, items: HackathonView[], limit = 3): HackathonView[] {
  return openOnly(items)
    .filter((h) => h.slug !== item.slug)
    .map((h) => ({
      h,
      score:
        h.themes.filter((t) => item.themes.includes(t)).length * 2 +
        (h.city && h.city === item.city ? 2 : 0) +
        (h.mode === item.mode ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ h }) => h);
}

export function themeCounts(items: HackathonView[]): Record<string, number> {
  const open = openOnly(items);
  return Object.fromEntries(THEMES.map((t) => [t.slug, open.filter((h) => h.themes.includes(t.slug)).length]));
}

export function cityCounts(items: HackathonView[]): Record<string, number> {
  const open = openOnly(items);
  const counts: Record<string, number> = Object.fromEntries(
    CITIES.map((c) => [c.slug, open.filter((h) => h.city === c.slug).length])
  );
  counts.online = open.filter((h) => h.mode === 'online').length;
  return counts;
}
