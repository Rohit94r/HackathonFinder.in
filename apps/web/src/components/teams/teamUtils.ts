import { CITIES, distanceKm, type LatLng, type Mode } from '@hackathonfinder/shared';
import type { ResultCounts } from '@/data/teamPosts';
import { formatKm } from '@/lib/format';

/** An open listing, slimmed down for the Team Finder. */
export interface TeamEvent {
  slug: string;
  title: string;
  city?: string;
  mode: Mode;
  teamMax: number;
  daysToDeadline: number;
}

export interface SkillMatch {
  /** Skills that line up, in the order they were listed. */
  matched: string[];
  pct: number;
}

export type TeamTab = 'teams' | 'people';
export type SortKey = 'match' | 'newest' | 'nearest';
export type ModeFilter = '' | 'in-person' | 'online';

export interface Filters {
  q: string;
  state: string;
  /** City slug, 'online' or '' for anywhere. */
  city: string;
  km: number;
  skills: string[];
  /** Teams tab: match picked skills against what a team needs or already has. */
  skillIn: 'needs' | 'has';
  hackathon: string;
  mode: ModeFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  state: '',
  city: '',
  km: 0,
  skills: [],
  skillIn: 'needs',
  hackathon: '',
  mode: '',
  sort: 'match',
};

export const PAGE_SIZE = 24;

export const STATES = Array.from(new Set(CITIES.map((c) => c.state))).sort();

export const TEAM_DISTANCE_OPTIONS = [
  { value: 0, label: 'Any distance' },
  { value: 50, label: '50 km' },
  { value: 150, label: '150 km' },
  { value: 500, label: '500 km' },
  { value: 1000, label: '1,000 km' },
];

/** City centre for a city slug; online teams have no place. */
export function cityPoint(slug: string): LatLng | undefined {
  const city = CITIES.find((c) => c.slug === slug);
  return city ? { lat: city.lat, lng: city.lng } : undefined;
}

export function kmTo(slug: string, origin: LatLng | null): number | undefined {
  const point = cityPoint(slug);
  return origin && point ? distanceKm(origin, point) : undefined;
}

/** Posts and profiles are only placed by city, so anything close reads as "your city". */
export function distanceLabel(km: number): string {
  return km < 20 ? 'In your city' : `${formatKm(km)} away`;
}

/** "Frontend", "Frontend and Backend", "Frontend, Backend and Data". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function skillMatch(offered: string[], wanted: string[]): SkillMatch | null {
  if (wanted.length === 0) return null;
  const matched = wanted.filter((s) => offered.includes(s));
  return { matched, pct: Math.round((matched.length / wanted.length) * 100) };
}

/** Days since an ISO timestamp. */
export function postAge(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 86400000));
}

export function postedLabel(days: number): string {
  if (days === 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  return `Posted ${days} days ago`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function resultCounts(record: { result: string }[]): ResultCounts {
  return {
    hackathons: record.length,
    wins: record.filter((r) => r.result === 'winner').length,
    podiums: record.filter((r) => r.result === 'winner' || r.result === 'runner-up').length,
    finals: record.filter((r) => r.result !== 'participant').length,
  };
}

// Query strings for the Team Finder API. The server page builds the same strings for
// its first paint, so SWR can reuse that data: keep these pure and the key order fixed.

function toQuery(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') p.set(k, String(v));
  return p.toString();
}

function nearParam(near: LatLng | null, km: number): string | undefined {
  return near ? [near.lat.toFixed(2), near.lng.toFixed(2), ...(km ? [km] : [])].join(',') : undefined;
}

/** GET /api/team-posts for the teams tab. `skills` are the student's own, for best-match sorting. */
export function teamPostsQuery(f: Filters, ctx: { near: LatLng | null; skills: string[] }): string {
  const sort = f.sort === 'match' && ctx.skills.length ? 'match' : f.sort === 'nearest' && ctx.near ? 'nearest' : 'newest';
  return toQuery({
    city: f.city,
    state: f.state,
    hackathon: f.hackathon,
    skills: f.skills.join(','),
    skillIn: f.skills.length && f.skillIn === 'has' ? 'has' : undefined,
    mode: f.mode,
    q: f.q.trim(),
    near: f.km || sort !== 'newest' ? nearParam(ctx.near, f.km) : undefined,
    sort,
    match: sort === 'match' ? ctx.skills.join(',') : undefined,
    notMine: 1,
    limit: PAGE_SIZE,
  });
}

/**
 * GET /api/people for the students tab. `match` is what the student's team needs;
 * without it, `lack` (their own skills) ranks students who bring something new.
 */
export function peopleQuery(f: Filters, ctx: { near: LatLng | null; match: string[]; lack: string[] }): string {
  const canMatch = ctx.match.length > 0 || ctx.lack.length > 0;
  const sort = f.sort === 'match' && canMatch ? 'match' : f.sort === 'nearest' && ctx.near ? 'nearest' : 'newest';
  return toQuery({
    city: f.city === 'online' ? '' : f.city,
    state: f.state,
    skills: f.skills.join(','),
    q: f.q.trim(),
    near: f.km || sort !== 'newest' ? nearParam(ctx.near, f.km) : undefined,
    sort,
    match: sort === 'match' && ctx.match.length ? ctx.match.join(',') : undefined,
    lack: sort === 'match' && !ctx.match.length ? ctx.lack.join(',') : undefined,
    notMe: 1,
    limit: PAGE_SIZE,
  });
}
