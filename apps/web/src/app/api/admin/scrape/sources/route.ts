import { adminRoute, scraperError } from '@/server/admin';
import { listScrapeSources } from '@/server/scrape';

/** Every source the scraper knows: on or off, health, last run, and keys it still needs. */
export const GET = adminRoute(async () => {
  try {
    return { sources: await listScrapeSources(), error: '' };
  } catch (err) {
    return { sources: [], error: scraperError(err).message };
  }
});
