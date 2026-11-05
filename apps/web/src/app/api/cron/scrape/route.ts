import { runScrapeNow, slotNear } from '@hackathonfinder/agents';
import { route } from '@/server/api';
import { assertCron } from '@/server/cron';
import { listingsChanged } from '@/server/hackathons';

// Scheduled scrape for hosts without a long-running server (Vercel Cron calls this at
// 02:00 and 14:00 IST; see vercel.json). Protected by CRON_SECRET. It waits for the
// run, so it stops taking new items before the function's time limit; whatever is
// left is picked up by the next run. A call near a slot time carries that slot, so a
// slot already run by another server is skipped.

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const handler = route(
  async ({ req }) => {
    assertCron(req);
    const slot = slotNear(new Date());
    const res = await runScrapeNow({ trigger: slot ? 'schedule' : 'api', slot, budgetMs: 240_000 });
    if (res.skipped) return { ok: true, runId: res.runId, skipped: res.skipped };
    const r = res.result!;
    // New and updated listings show on every page straight away, not after the cache expires.
    listingsChanged();
    return { ok: r.status !== 'failed', runId: res.runId, status: r.status, counts: r.counts, unchanged: r.unchanged, durationMs: r.durationMs };
  },
  { auth: 'none' }
);

export const GET = handler;
export const POST = handler;
