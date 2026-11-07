// Runs once when the Next.js server starts. On a long-running Node server it starts
// the discovery scheduler: scrapes every six hours (02:00, 08:00, 14:00 and 20:00 India time; see apps/agents).
//
// Off when SCRAPE_SCHEDULER=off, and on Vercel (serverless functions can't keep a
// timer; Vercel Cron calls /api/cron/scrape instead). In production (`next start`)
// it also catches up once on a slot that was missed while the server was off;
// SCRAPE_CATCHUP=on does that in development too, SCRAPE_CATCHUP=off never.

export async function register() {
  // This exact check lets Next leave the engine out of the edge bundle.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.SCRAPE_SCHEDULER === 'off' || process.env.VERCEL || !process.env.MONGODB_URI) return;
    const { startScheduler } = await import('@hackathonfinder/agents');
    const catchUp = process.env.SCRAPE_CATCHUP ? process.env.SCRAPE_CATCHUP === 'on' : process.env.NODE_ENV === 'production';
    startScheduler({ catchUp, log: (line) => console.log(`[scrape] ${line}`) });
  }
}
