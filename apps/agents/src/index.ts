// The discovery engine as a library, for the website (apps/web/src/server/scrape.ts,
// the cron route and instrumentation) and the CLI. Importing it has no side effects.

export { runScrape, redact, PIPELINE_VERSION, type ScrapeOptions, type ScrapeResult, type RunItem } from './run';
export { launchScrape, runScrapeNow, startScheduler, type LaunchOptions, type LaunchResult, type Scheduler, type SchedulerOptions } from './launch';
export { acquireRun, failStaleRuns, markRunFailed, lastScrapeStart, STALE_RUN_MS, RUN_BUDGET_MS, type Trigger, type Acquired } from './lock';
export { SCRAPE_TIMES, SCRAPE_TIMEZONE, SCRAPE_CRON, SCRAPE_CRON_UTC, slotId, slotTime, latestSlot, nextSlot, slotNear, needsCatchUp } from './slots';
export { syncSources, sourceStatuses, setSourceEnabled, type SourceStatus } from './sources';
export { CONNECTORS, connectorBySlug, missingEnv } from './connectors';
export { Http } from './http';
export type { Connector, ConnectorContext, RawCandidate, CandidateData, RunCounts } from './types';
