import cron from 'node-cron';
import { connectDb } from '@hackathonfinder/db';
import { errorMessage } from './errors';
import { acquireRun, lastScrapeStart, markRunFailed, type Trigger } from './lock';
import { runScrape, type ScrapeOptions, type ScrapeResult } from './run';
import { latestSlot, needsCatchUp, SCRAPE_CRON, SCRAPE_TIMEZONE, slotId } from './slots';

// Starting scrapes from anywhere: "Scrape now" (background), Vercel Cron (awaited),
// and the 02:00 / 14:00 timers in the website and the agents worker.

export interface LaunchOptions extends Pick<ScrapeOptions, 'sources' | 'limit' | 'budgetMs' | 'log'> {
  trigger: Trigger;
  startedBy?: string;
  slot?: string;
}

export type LaunchResult =
  | { runId: string; alreadyRunning: false; slotTaken?: false }
  | { runId: string; alreadyRunning: true; slotTaken?: false }
  | { runId: string; alreadyRunning: false; slotTaken: true };

/**
 * Records a run and starts it in the background; returns as soon as it is recorded.
 * When a scrape is already running, that run's id comes back (alreadyRunning).
 */
export async function launchScrape(opts: LaunchOptions): Promise<LaunchResult> {
  await connectDb();
  const lock = await acquireRun({ trigger: opts.trigger, sources: opts.sources, startedBy: opts.startedBy, slot: opts.slot });
  if (lock.kind === 'already-running') return { runId: lock.runId, alreadyRunning: true };
  if (lock.kind === 'slot-taken') return { runId: lock.runId, alreadyRunning: false, slotTaken: true };
  void runScrape({ ...opts, runId: lock.runId }).catch((err) => markRunFailed(lock.runId, err));
  return { runId: lock.runId, alreadyRunning: false };
}

/** Like launchScrape, but waits for the run to finish (cron routes on serverless hosts). */
export async function runScrapeNow(opts: LaunchOptions): Promise<{ runId: string; skipped?: 'already-running' | 'slot-taken'; result?: ScrapeResult }> {
  await connectDb();
  const lock = await acquireRun({ trigger: opts.trigger, sources: opts.sources, startedBy: opts.startedBy, slot: opts.slot });
  if (lock.kind !== 'started') return { runId: lock.runId, skipped: lock.kind };
  try {
    const result = await runScrape({ ...opts, runId: lock.runId });
    return { runId: lock.runId, result };
  } catch (err) {
    await markRunFailed(lock.runId, err);
    throw err;
  }
}

export interface SchedulerOptions {
  /** On start, run once for a slot that was missed while the server was off (see needsCatchUp). */
  catchUp?: boolean;
  log?: (line: string) => void;
  /** Passed to each run, e.g. a time budget. */
  run?: Pick<ScrapeOptions, 'budgetMs' | 'log'>;
}

export interface Scheduler {
  stop(): void;
}

const g = globalThis as typeof globalThis & { __hfScrapeScheduler?: Scheduler };

/**
 * Runs a scrape at 02:00 and 14:00 India time. Each run carries its slot id, so the
 * same slot never runs twice (even with several servers or Vercel Cron too). Safe to
 * call more than once per process: the first scheduler is reused.
 */
export function startScheduler(opts: SchedulerOptions = {}): Scheduler {
  if (g.__hfScrapeScheduler) return g.__hfScrapeScheduler;
  const log = opts.log ?? ((line: string) => console.log(`[scrape] ${line}`));
  const fire = async (slot: string, why: string) => {
    try {
      const res = await launchScrape({ trigger: 'schedule', slot, ...opts.run });
      if (res.slotTaken) log(`slot ${slot} already ran (${why}); skipped`);
      else if (res.alreadyRunning) log(`a scrape is already running (${res.runId}); slot ${slot} skipped`);
      else log(`started scheduled scrape ${res.runId} for ${slot} (${why})`);
    } catch (err) {
      log(`could not start the scheduled scrape for ${slot}: ${errorMessage(err)}`);
    }
  };
  const task = cron.schedule(SCRAPE_CRON, () => fire(slotId(latestSlot(new Date())), 'on time'), { timezone: SCRAPE_TIMEZONE, name: 'hackathonfinder-scrape', noOverlap: true });
  log(`scheduled scrapes at 02:00 and 14:00 ${SCRAPE_TIMEZONE}`);
  if (opts.catchUp) {
    void (async () => {
      try {
        await connectDb();
        const now = new Date();
        if (needsCatchUp(now, await lastScrapeStart())) await fire(slotId(latestSlot(now)), 'catch-up after the server was off');
      } catch (err) {
        log(`catch-up check failed: ${errorMessage(err)}`);
      }
    })();
  }
  const scheduler: Scheduler = {
    stop() {
      task.stop();
      if (g.__hfScrapeScheduler === scheduler) g.__hfScrapeScheduler = undefined;
    },
  };
  g.__hfScrapeScheduler = scheduler;
  return scheduler;
}
