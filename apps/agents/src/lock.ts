import { AgentRun, Types, User, type IAgentRun } from '@hackathonfinder/db';
import { errorMessage } from './errors';

// Starting a scrape: one at a time, one per scheduled slot. A unique partial index
// on AgentRun ({ agent } where status is "running") makes the database refuse a
// second running scrape, so two servers (or a click during a scheduled run) can't
// start overlapping runs. A run "running" for over 45 minutes is taken as dead (the
// process was killed) and marked failed; runs stop themselves well before that.

export const STALE_RUN_MS = 45 * 60_000;
/** How long a run may work before it stops taking new items (under STALE_RUN_MS). */
export const RUN_BUDGET_MS = 40 * 60_000;

export type Trigger = 'manual' | 'schedule' | 'api';

export interface AcquireOptions {
  trigger: Trigger;
  sources?: string[];
  /** Admin user id (or handle) who pressed "Scrape now". */
  startedBy?: string;
  slot?: string;
  now?: Date;
}

export type Acquired =
  | { kind: 'started'; runId: string }
  | { kind: 'already-running'; runId: string }
  | { kind: 'slot-taken'; runId: string };

let indexes: Promise<unknown> | null = null;

/** The unique indexes the lock relies on exist (built once per process). */
export function ensureRunIndexes(): Promise<unknown> {
  if (!indexes) {
    indexes = AgentRun.createIndexes().catch((err) => {
      indexes = null;
      throw err;
    });
  }
  return indexes;
}

/** Marks scrapes stuck in "running" for longer than STALE_RUN_MS as failed. Returns how many. */
export async function failStaleRuns(now = new Date()): Promise<number> {
  const res = await AgentRun.updateMany(
    { agent: 'scrape', status: 'running', startedAt: { $lt: new Date(now.getTime() - STALE_RUN_MS) } },
    {
      $set: { status: 'failed', finishedAt: now, 'progress.current': 'Stopped' },
      $push: { errorLog: 'Stopped responding (still "running" after 45 minutes; the server probably restarted). Marked as failed.' },
    }
  );
  return res.modifiedCount ?? 0;
}

/** An admin's id from "Scrape now": a user id, or a handle we look up. Undefined when neither matches. */
export async function resolveUserId(startedBy: string | undefined): Promise<Types.ObjectId | undefined> {
  if (!startedBy) return undefined;
  if (Types.ObjectId.isValid(startedBy) && String(new Types.ObjectId(startedBy)) === startedBy) return new Types.ObjectId(startedBy);
  const handle = String(startedBy).toLowerCase().slice(0, 60);
  const user = await User.findOne({ handle }).select('_id').lean();
  return user?._id as Types.ObjectId | undefined;
}

function duplicateKey(err: unknown): Record<string, unknown> | null {
  const e = err as { code?: number; keyPattern?: Record<string, unknown> };
  return e?.code === 11000 ? e.keyPattern ?? {} : null;
}

/**
 * Records a new running scrape, unless one is running already (that run comes back)
 * or this slot already ran. The database's unique indexes settle races between servers.
 */
export async function acquireRun(opts: AcquireOptions): Promise<Acquired> {
  const now = opts.now ?? new Date();
  await ensureRunIndexes();
  await failStaleRuns(now);
  if (opts.slot) {
    const taken = await AgentRun.findOne({ slot: String(opts.slot) }).select('_id').lean();
    if (taken) return { kind: 'slot-taken', runId: String(taken._id) };
  }
  const running = await AgentRun.findOne({ agent: 'scrape', status: 'running' }).select('_id').lean();
  if (running) return { kind: 'already-running', runId: String(running._id) };

  const startedBy = await resolveUserId(opts.startedBy).catch(() => undefined);
  try {
    const run = await AgentRun.create({
      agent: 'scrape',
      status: 'running',
      trigger: opts.trigger,
      sources: (opts.sources ?? []).map(String).slice(0, 50),
      slot: opts.slot ? String(opts.slot) : undefined,
      startedBy,
      startedAt: now,
      progress: { done: 0, total: 0, current: 'Starting…' },
      log: [`Started (${opts.trigger}${opts.slot ? `, slot ${opts.slot}` : ''})`],
    });
    return { kind: 'started', runId: String(run._id) };
  } catch (err) {
    const key = duplicateKey(err);
    if (!key) throw err;
    if ('slot' in key && opts.slot) {
      const taken = await AgentRun.findOne({ slot: String(opts.slot) }).select('_id').lean();
      return { kind: 'slot-taken', runId: String(taken?._id ?? '') };
    }
    const other = await AgentRun.findOne({ agent: 'scrape', status: 'running' }).select('_id').lean();
    if (other) return { kind: 'already-running', runId: String(other._id) };
    throw err;
  }
}

/** Marks a run failed after a crash (only if it is still "running"). */
export async function markRunFailed(runId: string, err: unknown): Promise<void> {
  if (!Types.ObjectId.isValid(runId)) return;
  await AgentRun.updateOne(
    { _id: new Types.ObjectId(runId), status: 'running' },
    { $set: { status: 'failed', finishedAt: new Date(), 'progress.current': 'Failed' }, $push: { errorLog: `Run crashed: ${errorMessage(err).slice(0, 500)}` } }
  ).catch(() => {});
}

/** When the last scrape (any trigger) started, for the catch-up check. */
export async function lastScrapeStart(): Promise<Date | undefined> {
  const last = await AgentRun.findOne({ agent: 'scrape', status: { $ne: 'skipped' } })
    .sort({ startedAt: -1 })
    .select('startedAt')
    .lean<Pick<IAgentRun, 'startedAt'>>();
  return last?.startedAt ? new Date(last.startedAt) : undefined;
}
