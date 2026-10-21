import {
  CITIES,
  EVENT_TYPES,
  MODES,
  THEMES,
  cityName,
  eventTypeLabel,
  prizeInInr,
  themeName,
  type EventType,
  type Mode,
  type ThemeSlug,
} from '@hackathonfinder/shared';
import type { HackathonView } from './hackathons';

export type StatusFilter = 'open' | 'closing-soon' | 'in-progress' | 'all';
export type FeeFilter = 'any' | 'free' | 'paid';
export type TeamFilter = 'any' | 'solo' | 'team';
export type EligibilityFilter = '' | 'students' | 'professionals' | 'women-only';
export type WithinFilter = '' | 'week' | 'month';
export type SortKey = 'deadline' | 'newest' | 'prize' | 'start';

export interface Filters {
  q: string;
  /** City slug, 'online', or '' for anywhere. */
  city: string;
  modes: Mode[];
  types: EventType[];
  themes: ThemeSlug[];
  status: StatusFilter;
  fee: FeeFilter;
  team: TeamFilter;
  eligibility: EligibilityFilter;
  beginner: boolean;
  minPrize: number;
  within: WithinFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  city: '',
  modes: [],
  types: [],
  themes: [],
  status: 'open',
  fee: 'any',
  team: 'any',
  eligibility: '',
  beginner: false,
  minPrize: 0,
  within: '',
  sort: 'deadline',
};

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'open', label: 'Open for registration' },
  { value: 'closing-soon', label: 'Closing soon' },
  { value: 'in-progress', label: 'Happening now' },
  { value: 'all', label: 'All events' },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'deadline', label: 'Deadline (soonest)' },
  { value: 'newest', label: 'Newly added' },
  { value: 'prize', label: 'Prize (highest)' },
  { value: 'start', label: 'Start date' },
];

export const PRIZE_OPTIONS = [
  { value: 0, label: 'Any prize' },
  { value: 50000, label: '₹50K+' },
  { value: 100000, label: '₹1L+' },
  { value: 200000, label: '₹2L+' },
];

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

function list<T extends string>(params: Params, key: string, allowed: readonly T[]): T[] {
  return one(params, key)
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
}

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const CITY_VALUES = ['online', ...CITIES.map((c) => c.slug)];

export function parseFilters(params: Params, preset: Partial<Filters> = {}): Filters {
  const base = { ...DEFAULT_FILTERS, ...preset };
  const city = one(params, 'city');
  const prize = Number(one(params, 'prize'));
  return {
    q: one(params, 'q').slice(0, 120),
    city: CITY_VALUES.includes(city) ? city : base.city,
    modes: list(params, 'mode', MODES.map((m) => m.value)).length
      ? list(params, 'mode', MODES.map((m) => m.value))
      : base.modes,
    types: list(params, 'type', EVENT_TYPES.map((t) => t.value)).length
      ? list(params, 'type', EVENT_TYPES.map((t) => t.value))
      : base.types,
    themes: list(params, 'theme', THEMES.map((t) => t.slug)).length
      ? list(params, 'theme', THEMES.map((t) => t.slug))
      : base.themes,
    status: pick(one(params, 'status'), ['open', 'closing-soon', 'in-progress', 'all'] as const, base.status),
    fee: pick(one(params, 'fee'), ['any', 'free', 'paid'] as const, base.fee),
    team: pick(one(params, 'team'), ['any', 'solo', 'team'] as const, base.team),
    eligibility: pick(one(params, 'eligibility'), ['', 'students', 'professionals', 'women-only'] as const, base.eligibility),
    beginner: one(params, 'beginner') === '1' || base.beginner,
    minPrize: PRIZE_OPTIONS.some((p) => p.value === prize) ? prize : base.minPrize,
    within: pick(one(params, 'within'), ['', 'week', 'month'] as const, base.within),
    sort: pick(one(params, 'sort'), ['deadline', 'newest', 'prize', 'start'] as const, base.sort),
  };
}

/** Builds a query string, leaving out anything equal to `base`. */
export function toQueryString(f: Filters, base: Filters = DEFAULT_FILTERS): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.city !== base.city) p.set('city', f.city);
  if (f.modes.join() !== base.modes.join()) p.set('mode', f.modes.join(','));
  if (f.types.join() !== base.types.join()) p.set('type', f.types.join(','));
  if (f.themes.join() !== base.themes.join()) p.set('theme', f.themes.join(','));
  if (f.status !== base.status) p.set('status', f.status);
  if (f.fee !== base.fee) p.set('fee', f.fee);
  if (f.team !== base.team) p.set('team', f.team);
  if (f.eligibility !== base.eligibility) p.set('eligibility', f.eligibility);
  if (f.beginner !== base.beginner) p.set('beginner', f.beginner ? '1' : '0');
  if (f.minPrize !== base.minPrize) p.set('prize', String(f.minPrize));
  if (f.within !== base.within) p.set('within', f.within);
  if (f.sort !== base.sort) p.set('sort', f.sort);
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

function matchesText(h: HackathonView, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [
    h.title,
    h.tagline,
    h.organizer,
    h.summary,
    cityName(h.city),
    h.venue ?? '',
    eventTypeLabel(h.type),
    ...h.themes.map(themeName),
  ]
    .join(' ')
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}

function matchesStatus(h: HackathonView, status: StatusFilter): boolean {
  if (status === 'all') return true;
  if (status === 'open') return h.status === 'open' || h.status === 'closing-soon';
  return h.status === status;
}

function matchesEligibility(h: HackathonView, e: EligibilityFilter): boolean {
  if (!e) return true;
  if (e === 'women-only') return h.eligibility.includes('women-only');
  if (e === 'students') {
    return h.eligibility.some((x) => x === 'students' || x === 'college-only' || x === 'open-to-all');
  }
  return h.eligibility.some((x) => x === 'professionals' || x === 'open-to-all');
}

export function applyFilters(items: HackathonView[], f: Filters): HackathonView[] {
  const result = items.filter(
    (h) =>
      matchesText(h, f.q) &&
      matchesStatus(h, f.status) &&
      (!f.city || (f.city === 'online' ? h.mode === 'online' : h.city === f.city)) &&
      (!f.modes.length || f.modes.includes(h.mode)) &&
      (!f.types.length || f.types.includes(h.type)) &&
      (!f.themes.length || f.themes.some((t) => h.themes.includes(t))) &&
      (f.fee === 'any' || (f.fee === 'free' ? h.fee === 0 : h.fee > 0)) &&
      (f.team === 'any' || (f.team === 'solo' ? h.teamMin === 1 : h.teamMax > 1)) &&
      matchesEligibility(h, f.eligibility) &&
      (!f.beginner || h.beginnerFriendly) &&
      prizeInInr(h.prizePool, h.prizeCurrency) >= f.minPrize &&
      (!f.within || (h.daysToDeadline >= 0 && h.daysToDeadline <= (f.within === 'week' ? 7 : 31)))
  );

  const sorters: Record<SortKey, (a: HackathonView, b: HackathonView) => number> = {
    deadline: (a, b) => Date.parse(a.registrationDeadline) - Date.parse(b.registrationDeadline),
    newest: (a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt),
    prize: (a, b) => prizeInInr(b.prizePool, b.prizeCurrency) - prizeInInr(a.prizePool, a.prizeCurrency),
    start: (a, b) => Date.parse(a.startDate) - Date.parse(b.startDate),
  };
  return result.sort(sorters[f.sort]);
}

export function activeFilterCount(f: Filters, base: Filters = DEFAULT_FILTERS): number {
  return (
    (f.city !== base.city ? 1 : 0) +
    f.modes.length +
    f.types.length +
    f.themes.length +
    (f.status !== base.status ? 1 : 0) +
    (f.fee !== base.fee ? 1 : 0) +
    (f.team !== base.team ? 1 : 0) +
    (f.eligibility !== base.eligibility ? 1 : 0) +
    (f.beginner !== base.beginner ? 1 : 0) +
    (f.minPrize !== base.minPrize ? 1 : 0) +
    (f.within !== base.within ? 1 : 0)
  );
}
