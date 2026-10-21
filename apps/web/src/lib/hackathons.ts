import {
  CITIES,
  THEMES,
  computeStatus,
  createSampleHackathons,
  daysUntil,
  isRegistrationOpen,
  type Hackathon,
  type Status,
} from '@hackathonfinder/shared';

/** A listing plus the fields worked out at request time. */
export interface HackathonView extends Hackathon {
  status: Status;
  daysToDeadline: number;
}

export interface HackathonSnapshot {
  nowIso: string;
  items: HackathonView[];
}

/**
 * Loads listings and works out their status for "now". Today this reads the
 * sample listings; it will read from the database once the agents are live.
 */
export function getHackathons(now: Date = new Date()): HackathonSnapshot {
  const items = createSampleHackathons(now).map((h) => ({
    ...h,
    status: computeStatus(h, now),
    daysToDeadline: daysUntil(h.registrationDeadline, now),
  }));
  return { nowIso: now.toISOString(), items };
}

export function getHackathon(slug: string, now: Date = new Date()) {
  const snapshot = getHackathons(now);
  const item = snapshot.items.find((h) => h.slug === slug);
  return item ? { ...snapshot, item } : null;
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
