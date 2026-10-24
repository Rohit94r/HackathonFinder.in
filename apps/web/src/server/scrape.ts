import 'server-only';
import { AgentRun, connectDb, Types, User, type IAgentRun, type IRunItem } from '@hackathonfinder/db';
import { failStaleRuns, launchScrape, setSourceEnabled, sourceStatuses } from '@hackathonfinder/agents';

// The website's door to the discovery engine (apps/agents): start a scrape, follow its
// progress and list past runs. The admin dashboard's "Scrape now", the scheduled runs
// (2:00 and 14:00 India time) and /api/cron/scrape all go through here.
//
// CONTRACT: the admin dashboard is built against these types and signatures. Keep them
// stable; implement the bodies.

export type ScrapeTrigger = 'manual' | 'schedule' | 'api';
export type ScrapeStatus = 'queued' | 'running' | 'success' | 'partial' | 'failed' | 'skipped';
export type ScrapeItemAction = 'created' | 'updated' | 'merged' | 'review' | 'rejected' | 'error';

/** When scheduled scrapes run, for the dashboard. */
export const SCRAPE_SCHEDULE = { times: ['02:00', '14:00'], timezone: 'Asia/Kolkata' } as const;

export interface ScrapeCounts {
  found: number;
  new: number;
  created: number;
  updated: number;
  merged: number;
  review: number;
  rejected: number;
  errors: number;
}

export interface ScrapeItem {
  action: ScrapeItemAction;
  source: string;
  title: string;
  /** Where we found it. */
  url: string;
  /** Listing slug, for created/updated/merged/review items. */
  slug?: string;
  hackathonId?: string;
  imageUrl?: string;
  /** "Pune", "Online", … */
  place?: string;
  mode?: string;
  reason?: string;
}

export interface ScrapeRunSummary {
  id: string;
  status: ScrapeStatus;
  trigger: ScrapeTrigger;
  sources: string[];
  startedAt: string;
  finishedAt?: string;
  /** Handle of the admin who started it, for manual runs. */
  startedBy?: string;
  counts: ScrapeCounts;
  progress: { done: number; total: number; current: string };
}

export interface ScrapeRunDetail extends ScrapeRunSummary {
  items: ScrapeItem[];
  errorLog: string[];
  log: string[];
}

export interface ScrapeSourceStatus {
  slug: string;
  name: string;
  kind: string;
  description: string;
  enabled: boolean;
  /** Env vars it needs that aren't set; it is skipped until they are. */
  missingEnv: string[];
  health: 'ok' | 'degraded' | 'failing' | 'blocked' | 'unknown';
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastItemCount?: number;
}

type LeanRun = Omit<IAgentRun, 'items'> & { items?: IRunItem[] };

const COUNT_KEYS: (keyof ScrapeCounts)[] = ['found', 'new', 'created', 'updated', 'merged', 'review', 'rejected', 'errors'];
const iso = (d: Date | string | undefined | null) => (d ? new Date(d).toISOString() : undefined);

function counts(raw: unknown): ScrapeCounts {
  const c = (raw ?? {}) as Record<string, unknown>;
  return Object.fromEntries(COUNT_KEYS.map((k) => [k, typeof c[k] === 'number' ? (c[k] as number) : 0])) as unknown as ScrapeCounts;
}

/** Admin handles for the runs' startedBy ids, in one query. */
async function handlesFor(runs: Pick<LeanRun, 'startedBy'>[]): Promise<Map<string, string>> {
  const ids = [...new Set(runs.map((r) => (r.startedBy ? String(r.startedBy) : '')).filter(Boolean))];
  if (!ids.length) return new Map();
  const users = await User.find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
    .select('handle')
    .lean();
  return new Map(users.map((u) => [String(u._id), u.handle]));
}

function summary(run: LeanRun, handles: Map<string, string>): ScrapeRunSummary {
  return {
    id: String(run._id),
    status: run.status,
    trigger: run.trigger,
    sources: run.sources ?? [],
    startedAt: iso(run.startedAt) ?? new Date(0).toISOString(),
    finishedAt: iso(run.finishedAt),
    startedBy: run.startedBy ? handles.get(String(run.startedBy)) : undefined,
    counts: counts(run.counts),
    progress: { done: run.progress?.done ?? 0, total: run.progress?.total ?? 0, current: run.progress?.current ?? '' },
  };
}

function item(i: IRunItem): ScrapeItem {
  return {
    action: i.action,
    source: i.source,
    title: i.title ?? '',
    url: i.url ?? '',
    slug: i.slug || undefined,
    hackathonId: i.hackathonId ? String(i.hackathonId) : undefined,
    imageUrl: i.imageUrl || undefined,
    place: i.mode === 'online' ? 'Online' : i.city || (i.mode ? 'India' : undefined),
    mode: i.mode || undefined,
    reason: i.reason || undefined,
  };
}

/**
 * Starts a scrape across `sources` (every enabled source when empty) unless one is
 * already running, in which case that run's id comes back with alreadyRunning: true.
 * Returns as soon as the run is recorded; the work carries on in the background and
 * updates the run's progress and items as it goes.
 */
export async function startScrape(opts: { trigger: ScrapeTrigger; sources?: string[]; startedBy?: string }): Promise<{ runId: string; alreadyRunning: boolean }> {
  await connectDb();
  const sources = (opts.sources ?? []).filter((s) => typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s));
  const res = await launchScrape({ trigger: opts.trigger, sources, startedBy: opts.startedBy });
  // A slot only applies to scheduled runs, and those don't come through here with one.
  return { runId: res.runId, alreadyRunning: res.alreadyRunning === true || res.slotTaken === true };
}

/** One run with everything it did, or null when there's no such run. */
export async function getScrapeRun(id: string): Promise<ScrapeRunDetail | null> {
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) return null;
  await connectDb();
  // A run whose server died shows as failed instead of "running" forever.
  await failStaleRuns().catch(() => 0);
  const run = await AgentRun.findOne({ _id: new Types.ObjectId(id), agent: 'scrape' }).lean<LeanRun>();
  if (!run) return null;
  const handles = await handlesFor([run]);
  return {
    ...summary(run, handles),
    items: (run.items ?? []).map(item),
    errorLog: run.errorLog ?? [],
    log: run.log ?? [],
  };
}

/** Recent scrape runs, newest first. */
export async function listScrapeRuns(limit = 20): Promise<ScrapeRunSummary[]> {
  await connectDb();
  const n = Math.max(1, Math.min(100, Math.floor(Number(limit) || 20)));
  await failStaleRuns().catch(() => 0);
  const runs = await AgentRun.find({ agent: 'scrape' }).sort({ startedAt: -1 }).limit(n).select('-items -log -errorLog').lean<LeanRun[]>();
  const handles = await handlesFor(runs);
  return runs.map((r) => summary(r, handles));
}

/** Every source the engine knows, with its health and whether it can run. */
export async function listScrapeSources(): Promise<ScrapeSourceStatus[]> {
  await connectDb();
  const statuses = await sourceStatuses();
  return statuses.map((s) => ({
    slug: s.slug,
    name: s.name,
    kind: s.kind,
    description: s.description,
    enabled: s.enabled,
    missingEnv: s.missingEnv,
    health: s.health,
    lastRunAt: iso(s.lastRunAt),
    lastSuccessAt: iso(s.lastSuccessAt),
    lastError: s.lastError,
    lastItemCount: s.lastItemCount,
  }));
}

/** Turns a source on or off for future runs. */
export async function setScrapeSourceEnabled(slug: string, enabled: boolean): Promise<void> {
  await connectDb();
  await setSourceEnabled(slug, enabled);
}
