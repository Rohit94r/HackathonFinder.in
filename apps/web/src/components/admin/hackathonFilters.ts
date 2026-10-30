// Filters for the admin hackathons table. Plain module (no 'use client'), so the server
// page can read them from the address bar and the table can use the same defaults.

export type ListingStateFilter = 'all' | 'live' | 'pending' | 'rejected' | 'removed';
export type HackathonSort = 'updated' | 'created' | 'deadline' | 'start' | 'views' | 'clicks' | 'title';

export interface HackathonFilters {
  state: ListingStateFilter;
  q: string;
  source: string;
  mode: '' | 'online' | 'offline' | 'hybrid';
  city: string;
  image: '' | '1' | '0';
  qr: '' | '1';
  sort: HackathonSort;
  page: number;
}

export const DEFAULT_FILTERS: HackathonFilters = { state: 'all', q: '', source: '', mode: '', city: '', image: '', qr: '', sort: 'updated', page: 1 };

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const pick = <T extends string>(value: string, allowed: readonly T[], fallback: T): T => ((allowed as readonly string[]).includes(value) ? (value as T) : fallback);
const slug = (v: string) => (/^[a-z0-9:._-]{0,60}$/.test(v) ? v : '');

/** Filters from the address bar (e.g. /admin/hackathons?state=live&source=unstop), each one checked. */
export function filtersFrom(sp: Search): HackathonFilters {
  return {
    state: pick(one(sp.state), ['all', 'live', 'pending', 'rejected', 'removed'] as const, DEFAULT_FILTERS.state),
    q: one(sp.q).slice(0, 80),
    source: slug(one(sp.source)),
    mode: pick(one(sp.mode), ['', 'online', 'offline', 'hybrid'] as const, ''),
    city: slug(one(sp.city)),
    image: pick(one(sp.image), ['', '1', '0'] as const, ''),
    qr: pick(one(sp.qr), ['', '1'] as const, ''),
    sort: pick(one(sp.sort), ['updated', 'created', 'deadline', 'start', 'views', 'clicks', 'title'] as const, DEFAULT_FILTERS.sort),
    page: Math.min(1000, Math.max(1, Number.parseInt(one(sp.page), 10) || 1)),
  };
}

/** Reasons offered when removing or rejecting a listing. */
export const REMOVE_REASONS = ['Scam or fraud', 'Fake or spam', 'Duplicate', 'Not a hackathon', 'Wrong details', 'Cancelled', 'Registration closed'];
