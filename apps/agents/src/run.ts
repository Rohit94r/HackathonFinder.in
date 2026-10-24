import pLimit from 'p-limit';
import { cityFromText, extractEvent, isAiEnabled } from '@hackathonfinder/ai';
import { AgentRun, connectDb, Hackathon, isDbConfigured, RawItem, slugify, Types, uniqueSlug, type IHackathon, type IRunItem, type RawItemStatus, type RunStatus } from '@hackathonfinder/db';
import { CITIES } from '@hackathonfinder/shared';
import { CONNECTORS, missingEnv } from './connectors';
import { Geocoder, nearestCatalogCity } from './enrich/geocode';
import { bannerPublicId, cloudinaryConfig, ImageMirror, isStoredCopy } from './enrich/images';
import { readPosterQr } from './enrich/qr';
import { BlockedError, errorMessage } from './errors';
import { Http } from './http';
import { RUN_BUDGET_MS, type Trigger } from './lock';
import { suspiciousFlags } from './pipeline/checks';
import { DedupeIndex, entryFromDoc, planMerge, type IndexEntry, type Match } from './pipeline/dedupe';
import { missingKeyFields, type Draft } from './pipeline/draft';
import { cityLabel, isCatalogCity, normalize, statedCity } from './pipeline/normalize';
import { derivedUpdate, writeCopy } from './pipeline/refresh';
import { notHackathonReason } from './pipeline/relevance';
import { validate, type Validation } from './pipeline/validate';
import { recordSourceRun, sourceSettings, syncSources } from './sources';
import { contentHash, hostOf, isPlaceholderImage, normalizeUrl } from './text';
import { zeroCounts, type CandidateData, type Connector, type ConnectorContext, type RawCandidate, type RunCounts } from './types';

// The discovery engine: Scout → normalize → enrich → dedupe → validate → publish.
// One function runs a whole scrape for the CLI, the website's "Scrape now", the
// cron route and the scheduler alike. It writes progress into the AgentRun as it
// goes, so the admin dashboard can follow along, and one failing source never
// stops the others (the run ends "partial").

export type RunItemAction = IRunItem['action'];

export interface RunItem {
  action: RunItemAction;
  source: string;
  title: string;
  url: string;
  slug?: string;
  hackathonId?: string;
  imageUrl?: string;
  /** City label ("Pune", "Bhopal"); empty for online events. */
  city?: string;
  mode?: string;
  reason?: string;
}

export interface ScrapeOptions {
  trigger?: Trigger;
  /** Connector slugs; every enabled source when empty. */
  sources?: string[];
  /** The AgentRun to write progress into (from acquireRun). */
  runId?: string;
  /** Most candidates per source. */
  limit?: number;
  /** Read sources and show what would happen; nothing is written or uploaded. */
  dryRun?: boolean;
  /** Stop taking new items after this long (the rest waits for the next run). */
  budgetMs?: number;
  /** Each log line, as it happens (the CLI prints them). */
  log?: (line: string) => void;
  now?: Date;
  env?: NodeJS.ProcessEnv;
  /** Tests: a stubbed client, connectors and no database. */
  http?: Http;
  connectors?: Connector[];
  useDb?: boolean;
}

export interface ScrapeResult {
  runId?: string;
  status: Extract<RunStatus, 'success' | 'partial' | 'failed' | 'skipped'>;
  counts: RunCounts;
  /** Seen again with nothing new (only their "last checked" time moved). */
  unchanged: number;
  items: RunItem[];
  sources: { slug: string; ok: boolean; found: number; error?: string }[];
  log: string[];
  errors: string[];
  images: { stored: number; failed: number };
  geocoding: { requests: number; found: number };
  durationMs: number;
}

const MAX_ITEMS = 600;
const MAX_LOG = 400;
const MAX_ERRORS = 200;
/** Candidates in the pipeline at once (each site still gets one request at a time). */
const WORKERS = 6;

/** Masks secrets that could end up in a message: tokens in URLs, credentials in connection strings. */
export function redact(line: string): string {
  return line
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/gi, '$1***@')
    .replace(/(cloudinary:\/\/)[^@\s]+@/gi, '$1***@')
    .replace(/([?&](?:access_token|api_key|apikey|key|signature|secret|api_secret|token|password)=)[^&\s]+/gi, '$1***');
}

function istClock(d = new Date()): string {
  return d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
}

/** Keeps the AgentRun in step: counts, progress, items and log lines, written at most every 1.5 s. */
class Recorder {
  counts = zeroCounts();
  progress = { done: 0, total: 0, current: 'Starting…' };
  items: RunItem[] = [];
  logs: string[] = [];
  errors: string[] = [];
  private pending = { items: [] as IRunItem[], log: [] as string[], errors: [] as string[] };
  private timer: NodeJS.Timeout | undefined;
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly runId: Types.ObjectId | undefined,
    private readonly echo: (line: string) => void
  ) {}

  log(message: string): void {
    const line = `${istClock()} ${redact(message)}`.slice(0, 1000);
    this.logs.push(line);
    this.pending.log.push(line);
    this.echo(line);
    this.soon();
  }

  error(message: string): void {
    const line = redact(message).slice(0, 1000);
    this.errors.push(line);
    this.pending.errors.push(line);
    this.counts.errors++;
    this.echo(`! ${line}`);
    this.soon();
  }

  item(i: RunItem): void {
    this.items.push(i);
    this.pending.items.push({
      ...i,
      title: i.title.slice(0, 200),
      url: i.url.slice(0, 1000),
      reason: i.reason?.slice(0, 300),
      hackathonId: i.hackathonId && Types.ObjectId.isValid(i.hackathonId) ? new Types.ObjectId(i.hackathonId) : undefined,
    });
    this.soon();
  }

  step(current: string): void {
    this.progress.current = current.slice(0, 200);
    this.soon();
  }

  soon(): void {
    if (!this.runId || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush();
    }, 1500);
  }

  /** Writes what changed since the last write (and `final` fields), one write at a time. */
  flush(final: Record<string, unknown> = {}): Promise<void> {
    if (!this.runId) return Promise.resolve();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    const items = this.pending.items.splice(0);
    const log = this.pending.log.splice(0);
    const errors = this.pending.errors.splice(0);
    const update: Record<string, unknown> = { $set: { counts: { ...this.counts }, progress: { ...this.progress }, heartbeatAt: new Date(), ...final } };
    const push: Record<string, unknown> = {};
    if (items.length) push.items = { $each: items, $slice: -MAX_ITEMS };
    if (log.length) push.log = { $each: log, $slice: -MAX_LOG };
    if (errors.length) push.errorLog = { $each: errors, $slice: -MAX_ERRORS };
    if (Object.keys(push).length) update.$push = push;
    const id = this.runId;
    this.chain = this.chain.then(() => AgentRun.updateOne({ _id: id }, update).then(() => undefined)).catch((err) => this.echo(`! could not save run progress: ${errorMessage(err)}`));
    return this.chain;
  }
}

/** A mutex: the dedupe-and-publish step runs one candidate at a time, so two copies of an event can't both be created. */
class Mutex {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.tail.then(fn, fn);
    this.tail = next.catch(() => undefined);
    return next;
  }
}

interface Scouted {
  connector: Connector;
  ctx: ConnectorContext;
  list: RawCandidate[];
  ok: boolean;
  error?: unknown;
  warnings: number;
}

interface Job {
  s: Scouted;
  c: RawCandidate;
}

/**
 * Jobs per source, handed out round-robin, so one site's slow detail pages don't hold
 * up the others. Sources join as soon as they have been read.
 */
class JobQueue {
  private readonly queues = new Map<string, Job[]>();
  private open: number;
  private turn = 0;
  private waiting: (() => void)[] = [];

  constructor(sources: number) {
    this.open = sources;
  }

  /** A source finished reading (with its jobs, possibly none). */
  add(slug: string, jobs: Job[]): void {
    this.queues.set(slug, [...(this.queues.get(slug) ?? []), ...jobs]);
    this.open--;
    this.waiting.splice(0).forEach((wake) => wake());
  }

  /** The next job, or null when every source is read and every job taken. */
  async next(): Promise<Job | null> {
    for (;;) {
      const ready = [...this.queues.entries()].filter(([, q]) => q.length);
      if (ready.length) {
        this.turn = (this.turn + 1) % ready.length;
        return ready[this.turn][1].shift()!;
      }
      if (this.open <= 0) return null;
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
  }
}

/** Bump when the pipeline's rules change, so items rejected under the old rules are read again. */
export const PIPELINE_VERSION = 2;

/** What the content hash covers: what the source said (not when we asked), and the rules version. */
function candidateHash(c: RawCandidate): string {
  return contentHash({ v: PIPELINE_VERSION, externalId: c.externalId, url: c.url, title: c.title, data: c.data, images: c.imageUrls });
}

/** Plain JSON copy of what the connector read, for the RawItem (no prototypes, no huge strings). */
function storedData(d: CandidateData): Record<string, unknown> {
  return JSON.parse(JSON.stringify(d, (_k, v) => (typeof v === 'string' ? v.slice(0, 2000) : v)));
}

function placeLabel(d: Pick<Draft, 'mode' | 'city' | 'cityName'>): string | undefined {
  if (d.mode === 'online') return undefined;
  return d.cityName || CITIES.find((c) => c.slug === d.city)?.name || undefined;
}

/**
 * Online events have no venue. A hybrid event abroad is listed online only when its main
 * way to take part is online (remoteOk), and then its summary names where it is based;
 * other hybrid events abroad stay hybrid, and validate() rejects them as in-person abroad.
 */
export function placeRules(d: Draft): void {
  if (d.mode === 'hybrid' && d.country && !/^(india|bharat)$/i.test(d.country) && d.remoteOk) {
    const where = [d.cityName ?? (d.city ? d.city.replace(/-/g, ' ') : ''), d.region].filter(Boolean).join(', ');
    d.mode = 'online';
    d.hybridOnline = true;
    d.basedIn = where || undefined;
    d.notes.push(`hybrid event based outside India (${where || d.country}); listed for its online part`);
  }
  if (d.mode === 'online') {
    d.city = undefined;
    d.cityName = undefined;
    d.venue = undefined;
    d.point = undefined;
    d.region = undefined;
  }
}

const sameSpot = (coords: number[] | undefined, p: { lat: number; lng: number }) =>
  Boolean(coords) && Math.abs(coords![0] - p.lng) < 1e-4 && Math.abs(coords![1] - p.lat) < 1e-4;

export async function runScrape(opts: ScrapeOptions = {}): Promise<ScrapeResult> {
  const started = Date.now();
  const now = opts.now ?? new Date();
  const env = opts.env ?? process.env;
  const useDb = opts.useDb ?? isDbConfigured();
  const dryRun = Boolean(opts.dryRun);
  const writes = useDb && !dryRun;
  const runOid = opts.runId && Types.ObjectId.isValid(opts.runId) ? new Types.ObjectId(opts.runId) : undefined;
  const rec = new Recorder(writes ? runOid : undefined, opts.log ?? (() => {}));
  // A heartbeat every minute even in quiet stretches, so a live run is never taken for a dead one.
  const heartbeat = writes && runOid ? setInterval(() => void rec.flush(), 60_000) : undefined;
  heartbeat?.unref?.();
  const budgetMs = opts.budgetMs ?? RUN_BUDGET_MS;
  const http = opts.http ?? new Http();
  const geocoder = writes ? new Geocoder(http, { useCache: true, log: (l) => rec.log(l) }) : null;
  // Three upload lanes for Cloudinary's API in real runs (tests pass one stubbed client).
  const uploaders = opts.http ? [http] : Array.from({ length: 3 }, () => new Http());
  const mirror = writes ? new ImageMirror(http, cloudinaryConfig(env), (l) => rec.log(l), uploaders) : null;
  const mutex = new Mutex();
  const sourceResults: ScrapeResult['sources'] = [];
  const touchedListings = new Set<string>();
  const touchedRaw: Types.ObjectId[] = [];
  let unchanged = 0;
  let budgetHit = 0;
  let status: ScrapeResult['status'] = 'success';

  const finish = async (): Promise<ScrapeResult> => {
    rec.progress.current = status === 'failed' ? 'Failed' : 'Done';
    const result: ScrapeResult = {
      runId: opts.runId,
      status,
      counts: rec.counts,
      unchanged,
      items: rec.items,
      sources: sourceResults,
      log: rec.logs,
      errors: rec.errors,
      images: { stored: mirror?.stored ?? 0, failed: mirror?.failed ?? 0 },
      geocoding: { requests: geocoder?.requests ?? 0, found: geocoder?.hits ?? 0 },
      durationMs: Date.now() - started,
    };
    if (heartbeat) clearInterval(heartbeat);
    await rec.flush({ status, finishedAt: new Date() });
    return result;
  };

  try {
    if (useDb) await connectDb();
    if (writes) await syncSources();

    // Which sources: the ones asked for, else every enabled one. Missing keys skip a source.
    const all = opts.connectors ?? CONNECTORS;
    const settings = useDb ? await sourceSettings() : new Map<string, { enabled: boolean; config: Record<string, unknown> }>();
    const requested = (opts.sources ?? []).map(String).filter(Boolean);
    for (const slug of requested) if (!all.some((c) => c.slug === slug)) rec.error(`Unknown source "${slug.slice(0, 40)}"`);
    const chosen = all.filter((c) => (requested.length ? requested.includes(c.slug) : settings.get(c.slug)?.enabled ?? !c.disabledByDefault));
    const runnable = chosen.filter((c) => {
      const missing = missingEnv(c, env);
      if (missing.length) rec.log(`${c.name}: skipped, needs ${missing.join(', ')}`);
      return !missing.length;
    });
    if (!runnable.length) {
      rec.log('No sources to run.');
      status = 'skipped';
      return await finish();
    }
    if (runOid && writes) await AgentRun.updateOne({ _id: runOid }, { $set: { sources: runnable.map((c) => c.slug) } });
    rec.log(`Reading ${runnable.length} sources: ${runnable.map((c) => c.name).join(', ')}${dryRun ? ' (dry run: nothing is saved)' : ''}`);
    if (writes && !mirror?.enabled) rec.log('Cloudinary is not configured; banners link to their source.');

    // What we already have: recent listings (never the sample ones) and what each source said last time.
    const index = useDb ? await DedupeIndex.load(now) : DedupeIndex.from([]);
    const raws = new Map<string, { _id: Types.ObjectId; contentHash: string; status: RawItemStatus; hackathonId?: Types.ObjectId; pipelineVersion?: number }>();
    const queue = new JobQueue(runnable.length);
    const scouted: Scouted[] = [];
    rec.log(`${index.size} recent listings to compare against.`);

    const saveRaw = async (j: Job, hash: string, rawStatus: RawItemStatus, extra: { hackathonId?: string; error?: string; confidence?: number; notes?: string[] }) => {
      if (!writes) return;
      const c = j.c;
      await RawItem.updateOne(
        { source: j.s.connector.slug, url: String(c.url) },
        {
          $set: {
            externalId: c.externalId ? String(c.externalId).slice(0, 100) : undefined,
            title: (c.title ?? c.data.title ?? '').slice(0, 300),
            text: (c.text ?? '').slice(0, 20_000),
            data: storedData(c.data),
            imageUrls: c.imageUrls.filter((u) => typeof u === 'string').slice(0, 5),
            contentHash: hash,
            pipelineVersion: PIPELINE_VERSION,
            status: rawStatus,
            hackathonId: extra.hackathonId && Types.ObjectId.isValid(extra.hackathonId) ? new Types.ObjectId(extra.hackathonId) : undefined,
            error: extra.error?.slice(0, 500),
            confidence: extra.confidence,
            notes: (extra.notes ?? []).slice(0, 30).map((n) => n.slice(0, 300)),
            lastSeenAt: now,
            processedAt: now,
          },
          $setOnInsert: { fetchedAt: now },
        },
        { upsert: true }
      );
    };

    const matchQuery = (d: Draft, c: RawCandidate) => ({
      listingSource: d.listingSource,
      externalId: c.externalId,
      url: c.url,
      registrationUrl: d.registrationUrl,
      title: d.title,
      start: d.startDate,
      city: d.city,
      mode: d.mode,
    });

    /** Our unmirrored copy of a banner (Cloudinary failed last time), which a later run should store. */
    const needsMirror = (e?: IndexEntry) => Boolean(mirror?.enabled && e?.imageUrl && e.imageUrl === e.sourceImageUrl && !isStoredCopy(e.imageUrl));
    /** A site's default picture stored as the banner (from before placeholders were filtered). */
    const placeholderImage = (e?: IndexEntry) => isPlaceholderImage(e?.sourceImageUrl) || isPlaceholderImage(e?.imageUrl);

    /** Optional: Claude fills gaps in posts and search results when ANTHROPIC_API_KEY is set. Rules do everything otherwise. */
    const aiFill = async (j: Job, d: Draft): Promise<RawCandidate> => {
      const { connector } = j.s;
      if (!isAiEnabled() || dryRun || (connector.extract !== 'always' && !missingKeyFields(d).length)) return j.c;
      try {
        const res = await extractEvent({ url: j.c.url, text: j.c.text, sourceHint: connector.name, known: j.c.data as Record<string, unknown>, now });
        if (!res) return j.c;
        const e = res.event;
        if (!e.isEvent) return { ...j.c, data: { ...j.c.data, flags: [...(j.c.data.flags ?? []), 'The AI reader thinks this is not one specific event'] } };
        const data: CandidateData = { ...j.c.data };
        const fill = <K extends keyof CandidateData>(k: K, v: CandidateData[K] | null | undefined) => {
          if ((data[k] === undefined || data[k] === '') && v !== null && v !== undefined && v !== '') data[k] = v;
        };
        fill('title', e.title);
        fill('mode', e.mode);
        fill('city', e.city ?? undefined);
        fill('venue', e.venue ?? undefined);
        fill('startDate', e.startDate ?? undefined);
        fill('endDate', e.endDate ?? undefined);
        fill('registrationDeadline', e.registrationDeadline ?? undefined);
        fill('teamMin', e.teamMin ?? undefined);
        fill('teamMax', e.teamMax ?? undefined);
        fill('fee', e.fee ?? undefined);
        fill('prizePool', e.prizePool ?? undefined);
        fill('organizer', e.organizer);
        if (!data.registrationUrl || data.registrationUrl === j.c.url) fill('registrationUrl', e.registrationUrl ?? undefined);
        return { ...j.c, data, text: j.c.text };
      } catch (err) {
        rec.log(`ai: extraction skipped (${errorMessage(err)})`);
        return j.c;
      }
    };

    const locate = async (d: Draft, c: RawCandidate) => {
      if (!d.mode || d.mode === 'online') return;
      if (d.country && !/^india$/i.test(d.country)) return;
      if (geocoder && !d.point?.exact) {
        const catalog = isCatalogCity(d.city) ? CITIES.find((x) => x.slug === d.city) : undefined;
        const cityText = catalog?.name ?? d.cityName ?? (statedCity(c.data.city) || undefined);
        const found = await geocoder.locate({ venue: d.venue, city: cityText, region: d.region }, catalog);
        if (found) {
          d.point = { lat: found.lat, lng: found.lng, exact: found.exact };
          if (!d.city && found.city) {
            d.city = cityFromText(found.city) ?? slugify(found.city, 40);
            d.cityName = cityLabel(d.city, found.city);
          }
          if (!d.region && found.state) d.region = found.state;
          if (!d.country) d.country = 'India';
          d.notes.push(found.exact ? 'venue located on the map' : 'located at the city centre');
        }
      }
      // A suburb close to one of our cities belongs on that city's page ("Kharghar" → Mumbai).
      if (d.city && !isCatalogCity(d.city) && d.point) {
        const near = nearestCatalogCity(d.point, 40);
        if (near) {
          d.notes.push(`${d.cityName ?? d.city} is within 40 km of ${near.name}`);
          d.city = near.slug;
          d.cityName = undefined;
        }
      }
    };

    const images = async (j: Job, d: Draft, entry?: IndexEntry) => {
      const { connector } = j.s;
      // Registration by QR code: read the poster's code and use the link it holds.
      if (d.registrationVia === 'qr') {
        const poster = d.imageUrl ?? j.c.imageUrls[0];
        if (poster) {
          const qr = await readPosterQr(http, poster);
          d.notes.push(qr.note);
          if (qr.link) {
            d.registrationUrl = qr.link;
            d.flags = d.flags.filter((f) => !/QR code/.test(f));
            d.flags.push(`Registration link was read from the poster’s QR code (${hostOf(qr.link)}) — check it`);
          }
        } else if (!d.flags.some((f) => /QR code/.test(f))) {
          d.flags.push('Registration is by QR code, but we have no poster yet — add it');
        }
      }
      // Existing listings keep their image unless it is our own copy that never reached Cloudinary,
      // or a site's placeholder picture.
      if (entry?.imageUrl && !needsMirror(entry) && !placeholderImage(entry)) return;
      const source = d.imageUrl ?? d.logoUrl;
      if (!source || isPlaceholderImage(source)) {
        d.imageUrl = undefined;
        return;
      }
      const usingLogo = !d.imageUrl;
      if (!mirror) {
        d.imageUrl = connector.storeImages === false ? undefined : source;
        d.sourceImageUrl = source;
        return;
      }
      const res = await mirror.mirror(source, bannerPublicId(d.listingSource, j.c.externalId ?? normalizeUrl(j.c.url), source));
      if (!res.url || (!res.stored && connector.storeImages === false)) {
        d.imageUrl = undefined;
        d.notes.push(`image not kept: ${res.reason ?? 'its link expires'}`);
        return;
      }
      d.imageUrl = res.url;
      d.sourceImageUrl = source;
      if (usingLogo) d.notes.push('no banner on the source; using the organizer’s logo');
    };

    const create = async (j: Job, d: Draft): Promise<{ doc: Pick<IHackathon, '_id' | 'slug'>; live: boolean }> => {
      // Hackathon platforms and event sites with structured data go live when nothing is flagged; leads wait for a person.
      const live = (j.s.connector.kind === 'platform' || j.s.connector.kind === 'events') && d.flags.length === 0 && d.confidence >= 0.6;
      const fields = {
        title: d.title,
        tagline: d.tagline,
        type: d.type,
        organizer: d.organizer,
        organizerType: d.organizerType,
        mode: d.mode,
        city: d.city,
        cityName: d.cityName,
        region: d.region,
        venue: d.venue,
        country: d.country || (d.mode === 'online' ? 'Global' : 'India'),
        location: d.point ? { type: 'Point' as const, coordinates: [d.point.lng, d.point.lat] as [number, number] } : undefined,
        startDate: d.startDate,
        endDate: d.endDate,
        registrationDeadline: d.registrationDeadline,
        teamMin: d.teamMin,
        teamMax: d.teamMax,
        teamSizeKnown: d.teamSizeKnown,
        eligibility: d.eligibility,
        fee: d.fee,
        prizePool: d.prizePool,
        prizeCurrency: d.prizeCurrency,
        prizes: d.prizes,
        perks: d.perks,
        themes: d.themes,
        beginnerFriendly: d.beginnerFriendly,
        registrationUrl: d.registrationUrl,
        registrationVia: d.registrationVia,
        sources: [d.listingSource],
        sourceRefs: [{ source: d.listingSource, url: j.c.url, externalId: j.c.externalId, firstSeenAt: now, lastSeenAt: now }],
        summary: d.summary,
        imageUrl: d.imageUrl,
        sourceImageUrl: d.imageUrl ? d.sourceImageUrl : undefined,
        logoUrl: d.logoUrl,
        lastChecked: now,
        state: (live ? 'live' : 'pending') as IHackathon['state'],
        confidence: d.confidence,
        flags: d.flags.slice(0, 10),
      };
      if (!writes) return { doc: { _id: new Types.ObjectId(), slug: slugify(d.title) }, live };
      const slug = await uniqueSlug(Hackathon, d.title);
      const doc = await Hackathon.create({ ...fields, slug });
      index.put(entryFromDoc(doc.toObject()));
      return { doc, live };
    };

    const merge = async (j: Job, d: Draft, match: Match, refresh: boolean): Promise<{ id: string; slug: string; action: RunItemAction | 'unchanged'; changed: string[] } | null> => {
      const doc = useDb ? await Hackathon.findById(match.entry.id).lean<IHackathon>() : null;
      if (!doc || doc.flags?.includes('sample')) return null;
      const ref = { source: d.listingSource, url: j.c.url, externalId: j.c.externalId };
      // The same platform listing two ids means two events: never fold one into the other.
      if ((doc.sourceRefs ?? []).some((r) => r.source === ref.source && r.externalId && ref.externalId && r.externalId !== ref.externalId)) return null;
      const sameSource = (doc.sourceRefs ?? []).some((r) => r.source === ref.source);
      const { set, changed } = planMerge(doc, d, { sameSource, now });
      const unset: string[] = [];
      if (changed.includes('teamMax') || changed.includes('teamMin')) set.teamSizeKnown = d.teamSizeKnown;
      // Rules changed since this source event was last processed: rewrite what we derive from it
      // (dates, team size, themes, our copy). A placeholder banner is dropped either way.
      const ownRef = (doc.sourceRefs ?? []).some((r) => r.source === ref.source && (ref.externalId ? r.externalId === ref.externalId : normalizeUrl(r.url) === normalizeUrl(ref.url)));
      const derived = derivedUpdate(doc, d, { dates: refresh && ownRef });
      if (refresh && ownRef) {
        Object.assign(set, derived.set);
        unset.push(...derived.unset);
        changed.push(...derived.changed.filter((k) => !changed.includes(k)));
      } else if (derived.changed.includes('imageUrl')) {
        if (derived.set.imageUrl) Object.assign(set, { imageUrl: derived.set.imageUrl, sourceImageUrl: derived.set.sourceImageUrl });
        else unset.push('imageUrl', 'sourceImageUrl');
        changed.push('imageUrl');
      }
      if (doc.mode !== 'online' && d.mode !== 'online') {
        if (!doc.cityName && d.cityName && (set.city ?? doc.city) === d.city) (set.cityName = d.cityName), changed.push('cityName');
        if (!doc.region && d.region) (set.region = d.region), changed.push('region');
        // An exact venue point beats the city centre we may have stored before.
        const centre = CITIES.find((c) => c.slug === doc.city);
        if (d.point?.exact && centre && sameSpot(doc.location?.coordinates, centre) && !sameSpot(doc.location?.coordinates, d.point)) {
          set.location = { type: 'Point', coordinates: [d.point.lng, d.point.lat] };
          changed.push('location');
        }
      }
      if (set.imageUrl && !set.sourceImageUrl) set.sourceImageUrl = d.sourceImageUrl ?? d.imageUrl;
      if (doc.imageUrl && doc.imageUrl === doc.sourceImageUrl && d.imageUrl && isStoredCopy(d.imageUrl) && d.sourceImageUrl === doc.sourceImageUrl) {
        set.imageUrl = d.imageUrl;
        changed.push('imageUrl');
      }
      const refs = [...(doc.sourceRefs ?? [])];
      const at = refs.findIndex((r) => r.source === ref.source && (ref.externalId ? r.externalId === ref.externalId : normalizeUrl(r.url) === normalizeUrl(ref.url)));
      if (at >= 0) refs[at] = { ...refs[at], url: ref.url, lastSeenAt: now };
      else refs.push({ ...ref, firstSeenAt: now, lastSeenAt: now });
      const sources = (doc.sources ?? []).includes(ref.source) ? doc.sources : [...(doc.sources ?? []), ref.source];
      for (const k of unset) delete set[k];
      if (writes) {
        await Hackathon.updateOne(
          { _id: doc._id },
          { $set: { ...set, sourceRefs: refs, sources }, ...(unset.length ? { $unset: Object.fromEntries(unset.map((k) => [k, 1])) } : {}) }
        );
        const after = { ...doc, ...(set as Partial<IHackathon>), sourceRefs: refs, sources };
        for (const k of unset) delete (after as Record<string, unknown>)[k];
        index.put(entryFromDoc(after));
        // A stored copy of a placeholder picture isn't needed any more.
        if (unset.includes('imageUrl') && mirror && isStoredCopy(doc.imageUrl, mirror.cloudName)) await mirror.destroy(doc.imageUrl!);
      }
      const action = !sameSource || at < 0 ? 'merged' : changed.length ? 'updated' : 'unchanged';
      return { id: String(doc._id), slug: doc.slug, action, changed };
    };

    const processOne = async (j: Job): Promise<void> => {
      const { connector } = j.s;
      const hash = candidateHash(j.c);
      const raw = raws.get(`${connector.slug}\n${j.c.url}`);
      let d = normalize(j.c, connector, { now });
      placeRules(d);
      let match = await mutex.run(async () => index.find(matchQuery(d, j.c)));
      const entry = match?.entry;
      if (!match && !raw) rec.counts.new++;
      // Processed under older rules: read it again in full and rewrite what we derived from it.
      const refresh = Boolean(raw && (raw.pipelineVersion ?? 1) < PIPELINE_VERSION);

      // Seen before with the same content: only the "last checked" time moves.
      if (raw && raw.contentHash === hash && !refresh) {
        if (raw.status === 'rejected') {
          rec.counts.rejected++;
          touchedRaw.push(raw._id);
          return;
        }
        if (entry && raw.hackathonId && String(raw.hackathonId) === entry.id && !needsMirror(entry) && !placeholderImage(entry) && (entry.imageUrl || !connector.detail)) {
          unchanged++;
          touchedListings.add(entry.id);
          touchedRaw.push(raw._id);
          return;
        }
      }

      // Not a hackathon-type event (a drone race in a fest's "hackathons" list): no detail page needed.
      const offTopic = notHackathonReason(d.title, j.c.data.tags ?? []);

      // The event's own page, only for new listings, ones still without a banner, and after a rules change.
      if (connector.detail && !offTopic && (!match || !entry?.imageUrl || !raw || refresh || placeholderImage(entry))) {
        try {
          j = { ...j, c: await connector.detail(j.c, j.s.ctx) };
          d = normalize(j.c, connector, { now });
          placeRules(d);
        } catch (err) {
          rec.log(`${connector.name}: detail page for "${d.title}" failed (${errorMessage(err)}); using the list data`);
        }
      }
      if (isAiEnabled()) {
        const filled = await aiFill(j, d);
        if (filled !== j.c) {
          j = { ...j, c: filled };
          d = normalize(j.c, connector, { now });
          placeRules(d);
        }
      }

      const check: Validation = offTopic ? { ok: false, reason: offTopic } : validate(d, now, { isNew: !match });
      const reason = check.ok ? undefined : (check as { reason: string }).reason;
      const ended = reason === 'event has already ended';
      if (reason && !(match && ended)) {
        rec.counts.rejected++;
        rec.item({ action: 'rejected', source: d.listingSource, title: d.title || j.c.title || j.c.url, url: j.c.url, mode: d.mode, city: placeLabel(d), reason });
        await saveRaw(j, hash, 'rejected', { error: reason, confidence: d.confidence, notes: d.notes });
        // A listing we made from this very source event that the rules now turn away is taken down too.
        if (match && writes && (match.reason === 'source-id' || match.reason === 'source-url') && (offTopic || /outside India/.test(reason))) {
          const res = await Hackathon.updateOne(
            { _id: new Types.ObjectId(match.entry.id), state: { $in: ['live', 'pending'] }, verified: { $ne: true } },
            { $set: { state: 'rejected', removedReason: reason.slice(0, 300), removedAt: now } }
          );
          if (res.modifiedCount) rec.log(`Took down "${d.title}": ${reason}`);
        }
        return;
      }
      d.flags.push(...suspiciousFlags(d).filter((f) => !d.flags.includes(f)));

      await locate(d, j.c);
      await images(j, d, match?.entry);
      writeCopy(d);

      await mutex.run(async () => {
        // Look again: another worker may have just created this event from another source.
        match = index.find(matchQuery(d, j.c));
        const merged = match ? await merge(j, d, match, refresh) : null;
        if (merged) {
          if (merged.action === 'unchanged') {
            unchanged++;
          } else {
            rec.counts[merged.action === 'merged' ? 'merged' : 'updated']++;
            rec.item({ action: merged.action, source: d.listingSource, title: d.title, url: j.c.url, slug: merged.slug, hackathonId: merged.id, imageUrl: d.imageUrl, mode: d.mode, city: placeLabel(d), reason: ended ? 'the event has ended' : merged.changed.length ? `changed: ${merged.changed.slice(0, 8).join(', ')}` : undefined });
          }
          await saveRaw(j, hash, 'merged', { hackathonId: merged.id, confidence: d.confidence, notes: d.notes });
          return;
        }
        if (!check.ok) return; // an ended event we no longer have: nothing to add
        const { doc, live } = await create(j, d);
        rec.counts[live ? 'created' : 'review']++;
        rec.item({
          action: live ? 'created' : 'review',
          source: d.listingSource,
          title: d.title,
          url: j.c.url,
          slug: doc.slug,
          hackathonId: String(doc._id),
          imageUrl: d.imageUrl,
          mode: d.mode,
          city: placeLabel(d),
          reason: live ? undefined : d.flags.join('; ') || 'waiting for review',
        });
        await saveRaw(j, hash, live ? 'published' : 'review', { hackathonId: String(doc._id), confidence: d.confidence, notes: d.notes });
      });
    };

    // 1. Scout: read every source in parallel (each site still gets one request at a time).
    //    A source's candidates join the queue as soon as it has been read.
    const scoutLimit = pLimit(4);
    const scouting = Promise.all(
      runnable.map((connector) =>
        scoutLimit(async () => {
          const s: Scouted = { connector, list: [], ok: false, warnings: 0, ctx: undefined as unknown as ConnectorContext };
          s.ctx = {
            http,
            source: { slug: connector.slug, name: connector.name, config: settings.get(connector.slug)?.config ?? connector.defaultConfig ?? {} },
            limit: opts.limit && opts.limit > 0 ? opts.limit : Infinity,
            now,
            env,
            log: (line) => rec.log(line),
            warn: (line) => {
              s.warnings++;
              rec.error(line);
            },
          };
          scouted.push(s);
          try {
            s.list = await connector.fetch(s.ctx);
            s.ok = true;
            if (useDb && s.list.length) {
              const docs = await RawItem.find({ source: connector.slug, url: { $in: s.list.map((c) => String(c.url)) } })
                .select('url contentHash status hackathonId pipelineVersion')
                .lean();
              for (const d of docs) raws.set(`${connector.slug}\n${d.url}`, { _id: d._id, contentHash: d.contentHash, status: d.status, hackathonId: d.hackathonId, pipelineVersion: d.pipelineVersion });
            }
          } catch (err) {
            s.error = err;
            if (err instanceof BlockedError) rec.log(`${connector.name}: blocked — ${errorMessage(err)}`);
            else rec.error(`${connector.name}: ${errorMessage(err)}`);
          }
          sourceResults.push({ slug: connector.slug, ok: s.ok, found: s.list.length, error: s.error ? redact(errorMessage(s.error)) : undefined });
          rec.counts.found += s.list.length;
          rec.progress.total += s.list.length;
          queue.add(connector.slug, s.list.map((c) => ({ s, c })));
        })
      )
    );

    // 2. Each candidate through the pipeline, a few at a time, round-robin across sources.
    const worker = async () => {
      for (let j = await queue.next(); j; j = await queue.next()) {
        if (Date.now() - started > budgetMs) {
          budgetHit++;
          rec.progress.done++;
          continue;
        }
        rec.step(`${j.s.connector.name}: ${(j.c.title ?? j.c.data.title ?? hostOf(j.c.url)).slice(0, 120)}`);
        try {
          await processOne(j);
        } catch (err) {
          const title = j.c.title ?? j.c.data.title ?? j.c.url;
          rec.error(`${j.s.connector.name}: "${title.slice(0, 120)}" failed: ${errorMessage(err)}`);
          rec.item({ action: 'error', source: j.c.data.listingSource ?? j.s.connector.slug, title, url: j.c.url, reason: errorMessage(err).slice(0, 300) });
          await saveRaw(j, candidateHash(j.c), 'error', { error: errorMessage(err) }).catch(() => {});
        }
        rec.progress.done++;
        rec.soon();
      }
    };
    await Promise.all([scouting, ...Array.from({ length: WORKERS }, worker)]);
    rec.log(`Read ${rec.counts.found} candidates from ${scouted.filter((s) => s.ok).length} of ${scouted.length} sources.`);

    if (writes && touchedListings.size) {
      await Hackathon.updateMany({ _id: { $in: [...touchedListings].map((id) => new Types.ObjectId(id)) } }, { $set: { lastChecked: now } });
    }
    if (writes && touchedRaw.length) await RawItem.updateMany({ _id: { $in: touchedRaw } }, { $set: { lastSeenAt: now } });
    if (budgetHit) rec.log(`Time budget reached: ${budgetHit} candidates left for the next run.`);

    // 4. Source health.
    if (writes) {
      for (const s of scouted) {
        await recordSourceRun(s.connector.slug, s.ok ? { ok: true, items: s.list.length, warnings: s.warnings } : { ok: false, error: s.error }, now).catch((err) =>
          rec.log(`could not update ${s.connector.slug} health: ${errorMessage(err)}`)
        );
      }
    }

    const failed = scouted.filter((s) => !s.ok && !(s.error instanceof BlockedError));
    const blocked = scouted.filter((s) => s.error instanceof BlockedError);
    status = failed.length + blocked.length === scouted.length ? 'failed' : failed.length || rec.errors.length || budgetHit ? 'partial' : 'success';
    const c = rec.counts;
    rec.log(
      `Finished: ${c.created} live, ${c.review} for review, ${c.updated} updated, ${c.merged} merged, ${unchanged} unchanged, ${c.rejected} rejected, ${c.errors} errors` +
        (mirror ? `; ${mirror.stored} images stored` : '') +
        (geocoder ? `; ${geocoder.requests} map lookups` : '') +
        ` (${Math.round((Date.now() - started) / 1000)} s)`
    );
    return await finish();
  } catch (err) {
    status = 'failed';
    rec.error(`Run failed: ${errorMessage(err)}`);
    return await finish();
  }
}

