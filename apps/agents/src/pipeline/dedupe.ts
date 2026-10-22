import { Hackathon, type IHackathon } from '@hackathonfinder/db';
import { sourceBySlug, type Mode, type SourceKind } from '@hackathonfinder/shared';
import { dice, isBareDomain, normalizeTitle, normalizeUrl } from '../text';
import type { Draft } from './draft';

const DAY = 24 * 3600_000;

/** Titles this alike (after dropping case, years and punctuation) can be the same event. */
export const TITLE_THRESHOLD = 0.85;
/** …when they also start within this window, in the same city (or both online). */
export const START_WINDOW_MS = 2 * DAY;

export interface IndexEntry {
  id: string;
  title: string;
  norm: string;
  start: number;
  city?: string;
  mode: Mode;
  /** Normalized registration URL. */
  regUrl: string;
  refs: { source: string; externalId?: string; url: string }[];
  sources: string[];
}

export interface MatchQuery {
  listingSource: string;
  externalId?: string;
  url: string;
  registrationUrl?: string;
  title: string;
  start?: Date;
  city?: string;
  mode?: Mode;
}

export type MatchReason = 'source-id' | 'source-url' | 'registration-url' | 'title';

export interface Match {
  entry: IndexEntry;
  reason: MatchReason;
  score: number;
}

type EventKey = { title: string; start?: Date | number; city?: string; mode?: Mode };

/** Similarity when two events look like the same one (title, start date, place), else null. */
export function sameEvent(a: EventKey, b: EventKey): number | null {
  if (a.start === undefined || b.start === undefined || !a.mode || !b.mode) return null;
  if (Math.abs(+a.start - +b.start) > START_WINDOW_MS) return null;
  const bothOnline = a.mode === 'online' && b.mode === 'online';
  const samePlace = a.mode !== 'online' && b.mode !== 'online' && (a.city ?? '') === (b.city ?? '');
  if (!bothOnline && !samePlace) return null;
  const score = dice(normalizeTitle(a.title), normalizeTitle(b.title));
  return score >= TITLE_THRESHOLD ? score : null;
}

export function entryFromDoc(doc: Pick<IHackathon, 'title' | 'startDate' | 'city' | 'mode' | 'registrationUrl' | 'sourceRefs' | 'sources'> & { _id: unknown }): IndexEntry {
  return {
    id: String(doc._id),
    title: doc.title,
    norm: normalizeTitle(doc.title),
    start: new Date(doc.startDate).getTime(),
    city: doc.city || undefined,
    mode: doc.mode,
    regUrl: isBareDomain(doc.registrationUrl) ? '' : normalizeUrl(doc.registrationUrl),
    refs: (doc.sourceRefs ?? []).map((r) => ({ source: r.source, externalId: r.externalId, url: isBareDomain(r.url) ? '' : normalizeUrl(r.url) })),
    sources: doc.sources ?? [],
  };
}

/** Recent listings in memory, so each candidate is compared without a query per rule. */
export class DedupeIndex {
  private entries = new Map<string, IndexEntry>();

  static async load(now: Date): Promise<DedupeIndex> {
    // Sample listings are made up; never merge real events into them.
    const docs = await Hackathon.find({ flags: { $ne: 'sample' }, endDate: { $gte: new Date(now.getTime() - 60 * DAY) } })
      .select('title startDate city mode registrationUrl sourceRefs sources')
      .lean();
    return DedupeIndex.from(docs.map((d) => entryFromDoc(d)));
  }

  static from(entries: IndexEntry[]): DedupeIndex {
    const index = new DedupeIndex();
    for (const e of entries) index.put(e);
    return index;
  }

  put(entry: IndexEntry): void {
    this.entries.set(entry.id, entry);
  }

  get size(): number {
    return this.entries.size;
  }

  find(q: MatchQuery): Match | null {
    const url = isBareDomain(q.url) ? '' : normalizeUrl(q.url);
    const reg = q.registrationUrl && !isBareDomain(q.registrationUrl) ? normalizeUrl(q.registrationUrl) : '';
    const all = [...this.entries.values()];
    if (q.externalId) {
      const hit = all.find((e) => e.refs.some((r) => r.source === q.listingSource && r.externalId === q.externalId));
      if (hit) return { entry: hit, reason: 'source-id', score: 1 };
    }
    if (url) {
      const hit = all.find((e) => e.refs.some((r) => r.url === url));
      if (hit) return { entry: hit, reason: 'source-url', score: 1 };
    }
    if (reg) {
      const hit = all.find((e) => e.regUrl === reg || e.refs.some((r) => r.url === reg));
      if (hit) return { entry: hit, reason: 'registration-url', score: 1 };
    }
    let best: Match | null = null;
    for (const e of all) {
      const score = sameEvent({ title: q.title, start: q.start, city: q.city, mode: q.mode }, { title: e.title, start: e.start, city: e.city, mode: e.mode });
      if (score !== null && (!best || score > best.score)) best = { entry: e, reason: 'title', score };
    }
    return best;
  }
}

const AUTHORITATIVE: SourceKind[] = ['platform', 'events', 'college'];

export function sourceKind(slug: string): SourceKind | undefined {
  return sourceBySlug(slug)?.kind;
}

type Existing = Pick<
  IHackathon,
  | 'tagline'
  | 'organizer'
  | 'venue'
  | 'city'
  | 'location'
  | 'mode'
  | 'imageUrl'
  | 'logoUrl'
  | 'prizes'
  | 'perks'
  | 'prizePool'
  | 'prizeCurrency'
  | 'themes'
  | 'summary'
  | 'beginnerFriendly'
  | 'startDate'
  | 'endDate'
  | 'registrationDeadline'
  | 'teamMin'
  | 'teamMax'
  | 'fee'
  | 'sources'
>;

/**
 * What a merge changes on an existing listing. Empty fields are filled from the new
 * source. Dates, mode, team size, fee and prizes are refreshed only from platform-like
 * sources (the same source again, or a platform over a social post). Title, summary and
 * registration link are never overwritten once set, so admin edits stay.
 */
export function planMerge(existing: Existing, d: Draft, opts: { sameSource: boolean; now: Date }): { set: Record<string, unknown>; changed: string[] } {
  const set: Record<string, unknown> = { lastChecked: opts.now };
  const changed: string[] = [];
  const put = (key: string, value: unknown) => {
    set[key] = value;
    changed.push(key);
  };
  const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
  const inPerson = existing.mode !== 'online';

  if (empty(existing.tagline) && d.tagline) put('tagline', d.tagline);
  if (empty(existing.organizer) && d.organizer) put('organizer', d.organizer);
  if (empty(existing.summary) && d.summary) put('summary', d.summary);
  if (inPerson && empty(existing.venue) && d.venue) put('venue', d.venue);
  if (inPerson && empty(existing.city) && d.city) put('city', d.city);
  if (inPerson && !existing.location?.coordinates?.length && d.point) put('location', { type: 'Point', coordinates: [d.point.lng, d.point.lat] });
  if (empty(existing.imageUrl) && d.imageUrl) put('imageUrl', d.imageUrl);
  if (empty(existing.logoUrl) && d.logoUrl) put('logoUrl', d.logoUrl);
  if (empty(existing.prizes) && d.prizes.length) put('prizes', d.prizes);
  if (empty(existing.perks) && d.perks.length) put('perks', d.perks);
  const onlyOpen = !existing.themes?.length || existing.themes.every((t) => t === 'open-innovation');
  if (onlyOpen && d.themes.some((t) => t !== 'open-innovation')) put('themes', d.themes);
  if (!existing.beginnerFriendly && d.beginnerFriendly) put('beginnerFriendly', true);

  const candidateKind = sourceKind(d.listingSource);
  const existingHasPlatform = (existing.sources ?? []).some((s) => AUTHORITATIVE.includes(sourceKind(s) as SourceKind));
  const authoritative = Boolean(candidateKind && AUTHORITATIVE.includes(candidateKind) && (opts.sameSource || !existingHasPlatform));
  const differs = (a: unknown, b: unknown) => (a instanceof Date || b instanceof Date ? +new Date(a as Date) !== +new Date(b as Date) : a !== b);
  if (authoritative) {
    if (d.startDate && differs(existing.startDate, d.startDate)) put('startDate', d.startDate);
    if (d.endDate && differs(existing.endDate, d.endDate)) put('endDate', d.endDate);
    if (d.registrationDeadline && differs(existing.registrationDeadline, d.registrationDeadline)) put('registrationDeadline', d.registrationDeadline);
    if (d.mode && d.mode !== existing.mode) put('mode', d.mode);
    if (d.teamMax !== existing.teamMax || d.teamMin !== existing.teamMin) {
      put('teamMin', d.teamMin);
      put('teamMax', d.teamMax);
    }
    if (d.fee !== existing.fee) put('fee', d.fee);
    if (d.prizePool > 0 && (d.prizePool !== existing.prizePool || d.prizeCurrency !== existing.prizeCurrency)) {
      put('prizePool', d.prizePool);
      put('prizeCurrency', d.prizeCurrency);
    }
  } else if (!existing.prizePool && d.prizePool > 0) {
    put('prizePool', d.prizePool);
    put('prizeCurrency', d.prizeCurrency);
  }
  return { set, changed };
}
