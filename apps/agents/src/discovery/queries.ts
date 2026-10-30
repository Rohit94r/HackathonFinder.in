import { CITIES, type City } from '@hackathonfinder/shared';
import { searchYears } from '../connectors/leads';

// The query matrix for India-wide web discovery. A run cannot search everything,
// so queries are weighted and the highest-value ones run first: cities, nationwide
// registration pages, college sites and event platforms. The city and state slices
// rotate by half day, so every part of India is covered over a few runs without
// making one run enormous. Public social posts are read by the social connectors.

export type DiscoveryQueryKind = 'city' | 'india' | 'month' | 'college' | 'platform' | 'state';

export interface DiscoveryQuery {
  query: string;
  city?: City;
  kind: DiscoveryQueryKind;
  /** Higher runs first. */
  weight: number;
}

export interface DiscoveryQueryOptions {
  /** Cities to search this run. Defaults to a rotating slice of the catalog. */
  cities?: City[];
  /** Hard cap after sorting. Defaults to 48. */
  max?: number;
  /** Adds lower-priority long-tail queries. Defaults to true. */
  deep?: boolean;
  now?: Date;
}

const CORE_EVENT_WORDS = ['hackathon', 'hackfest', 'ideathon', 'buildathon', 'codefest', 'datathon'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthName(now: Date, offset: number): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  return MONTH_NAMES[d.getUTCMonth()];
}

function add(out: DiscoveryQuery[], query: string, kind: DiscoveryQueryKind, weight: number, city?: City): void {
  out.push({ query: query.replace(/\s+/g, ' ').trim(), kind, weight, city });
}

/** Unique states in catalog order, so state queries rotate too. */
function states(): string[] {
  return [...new Set(CITIES.map((c) => c.state))];
}

function rotate<T>(items: T[], now: Date, count: number): T[] {
  if (!items.length) return [];
  const halfDay = Math.floor(now.getTime() / (12 * 3600_000));
  const start = halfDay % items.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, items.length); i++) out.push(items[(start + i) % items.length]);
  return out;
}

/**
 * Every query the deep web source should try this run, best first. The caller
 * can cap the list and can disable the long tail with `deep: false`.
 */
export function discoveryQueries(now: Date, opts: DiscoveryQueryOptions = {}): DiscoveryQuery[] {
  const max = Math.max(1, Math.min(200, opts.max ?? 48));
  const deep = opts.deep !== false;
  const cities = opts.cities ?? rotate(CITIES, now, 6);
  const [year, next] = searchYears(now);
  const nextYear = next ?? year + 1;
  const out: DiscoveryQuery[] = [];

  // City queries: the strongest signal for local college and community events.
  for (const city of cities) {
    add(out, `hackathon ${city.name} ${year} registration`, 'city', 100, city);
    add(out, `${city.name} college hackathon ${year}`, 'city', 96, city);
    add(out, `${city.name} hackfest OR ideathon ${year}`, 'city', 88, city);
    if (deep) add(out, `${city.name} hackathon ${monthName(now, 0)} ${year}`, 'city', 78, city);
  }

  // Nationwide pages that list many events at once.
  add(out, `hackathon India ${nextYear} registration open`, 'india', 99);
  add(out, `upcoming hackathons India ${year}`, 'india', 98);
  add(out, `hackathon India ${year} apply`, 'india', 95);
  add(out, `ideathon India ${year} registration`, 'india', 92);
  add(out, `buildathon India ${year}`, 'india', 88);
  add(out, `datathon India ${year}`, 'india', 84);
  add(out, `hackathon India prize pool ${year}`, 'india', 80);
  add(out, `24 hour hackathon India ${year}`, 'india', 76);

  // Events happening soon, so the listings stay useful rather than only archival.
  for (let i = 0; i < 4; i++) add(out, `hackathon ${monthName(now, i)} ${year} India`, 'month', 90 - i * 2);

  // College and university sites, including the long tail of .ac.in / .edu.in hosts.
  add(out, `site:ac.in hackathon ${year}`, 'college', 94);
  add(out, `site:edu.in hackathon ${year}`, 'college', 90);
  add(out, `college fest hackathon ${year} India`, 'college', 89);
  add(out, `inurl:hackathon site:ac.in`, 'college', 86);
  add(out, `inurl:fest hackathon ${year}`, 'college', 82);
  if (deep) add(out, `site:ac.in ideathon OR hackfest ${year}`, 'college', 78);

  // Public event platforms that do not have a dedicated connector yet. Dedicated
  // connectors (Unstop, Devfolio, Devpost, MLH, HackerEarth, lablab, KnowAFest)
  // are handled by their own sources.
  const platforms: [string, number][] = [
    ['hack2skill.com', 93],
    ['dorahacks.io', 90],
    ['konfhub.com', 88],
    ['townscript.com', 86],
    ['allevents.in', 84],
    ['lu.ma', 83],
    ['eventbrite.co.in', 80],
    ['meetup.com', 78],
    ['commudle.com', 77],
    ['techgig.com', 76],
    ['kaggle.com/competitions', 74],
  ];
  for (const [host, weight] of platforms) add(out, `site:${host} hackathon India ${year}`, 'platform', weight);

  // State-level queries cover smaller cities outside the catalog.
  for (const state of rotate(states(), now, deep ? 6 : 3)) add(out, `hackathon ${state} ${year}`, 'state', 87);

  if (deep) {
    add(out, `hackathon registration open India ${year} last date`, 'india', 74);
    add(out, `hackfest ${year} India`, 'india', 72);
    add(out, `coding challenge India ${year} students`, 'india', 70);
    add(out, `innovation challenge India ${year} college students`, 'india', 68);
    for (const word of CORE_EVENT_WORDS.slice(0, 3)) add(out, `${word} ${monthName(now, 1)} ${year} India`, 'month', 66);
  }

  // Dedupe exact queries, keeping the highest weight, then sort. A plain weight
  // sort would let the many city queries fill the whole run and starve the
  // nationwide, platform and state slices; caps keep every category represented.
  const byQuery = new Map<string, DiscoveryQuery>();
  for (const q of out) {
    const key = q.query.toLowerCase();
    const existing = byQuery.get(key);
    if (!existing || q.weight > existing.weight) byQuery.set(key, q);
  }
  const sorted = [...byQuery.values()].sort((a, b) => b.weight - a.weight);
  const caps: Record<DiscoveryQueryKind, number> = {
    city: Math.max(3, Math.floor(max * 0.3)),
    india: 8,
    month: 4,
    college: 6,
    platform: 11,
    state: 6,
  };
  const counts: Partial<Record<DiscoveryQueryKind, number>> = {};
  const picked: DiscoveryQuery[] = [];
  for (const q of sorted) {
    if (picked.length >= max) break;
    if ((counts[q.kind] ?? 0) >= caps[q.kind]) continue;
    picked.push(q);
    counts[q.kind] = (counts[q.kind] ?? 0) + 1;
  }
  // If caps left room (small max, or a category had fewer queries), fill by weight.
  if (picked.length < max) {
    const seen = new Set(picked.map((q) => q.query.toLowerCase()));
    for (const q of sorted) {
      if (picked.length >= max) break;
      if (seen.has(q.query.toLowerCase())) continue;
      seen.add(q.query.toLowerCase());
      picked.push(q);
    }
  }
  return picked;
}
