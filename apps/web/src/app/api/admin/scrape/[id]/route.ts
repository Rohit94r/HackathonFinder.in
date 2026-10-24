import { notFound } from '@/server/api';
import { adminRoute, enrichScrapeItems, idParam, scraperError } from '@/server/admin';
import { getScrapeRun, type ScrapeRunDetail } from '@/server/scrape';

/**
 * One scrape run with everything it found. Each item comes with its listing's
 * registration link and whether registration is by QR code, so the admin can check
 * and keep or remove it right there. Polled every 2 seconds while the run is going.
 */
export const GET = adminRoute<{ id: string }>(async ({ params }) => {
  const id = idParam(params.id, 'That run');
  let run: ScrapeRunDetail | null;
  try {
    run = await getScrapeRun(id);
  } catch (err) {
    throw scraperError(err);
  }
  if (!run) throw notFound('That run');
  return {
    run: {
      ...run,
      items: await enrichScrapeItems((run.items ?? []).slice(-1000)),
      errorLog: (run.errorLog ?? []).slice(-100),
      log: (run.log ?? []).slice(-300),
    },
  };
});
