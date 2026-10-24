import { z } from 'zod';
import { readBody } from '@/server/api';
import { adminRoute, audit, nextScheduledScrape, scheduleLabel, scraperError } from '@/server/admin';
import { listScrapeRuns, SCRAPE_SCHEDULE, startScrape } from '@/server/scrape';

/** The schedule, when the next run starts, and recent runs (or why the scraper can't answer yet). */
export const GET = adminRoute(async () => {
  const schedule = { times: [...SCRAPE_SCHEDULE.times], timezone: SCRAPE_SCHEDULE.timezone, label: scheduleLabel(), nextRunAt: nextScheduledScrape() };
  try {
    return { schedule, runs: await listScrapeRuns(30), error: '' };
  } catch (err) {
    return { schedule, runs: [], error: scraperError(err).message };
  }
});

const Body = z
  .object({
    /** Source slugs to scrape; empty means every enabled source. */
    sources: z
      .array(z.string().regex(/^[a-z0-9:._-]{1,100}$/))
      .max(50)
      .default([]),
  })
  .strict();

/** "Scrape now": starts a run right away (or returns the one already running). */
export const POST = adminRoute(
  async ({ req, user }) => {
    const { sources } = await readBody(req, Body);
    let result: { runId: string; alreadyRunning: boolean };
    try {
      result = await startScrape({ trigger: 'manual', sources: sources.length ? sources : undefined, startedBy: user.id });
    } catch (err) {
      throw scraperError(err);
    }
    if (!result.alreadyRunning) {
      await audit(user, 'scrape.start', 'scrape', result.runId, `Started a scrape${sources.length ? ` of ${sources.join(', ')}` : ' of every enabled source'}`);
    }
    return result;
  },
  { limit: 6, windowMs: 60_000 }
);
