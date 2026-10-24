import { z } from 'zod';
import { notFound, readBody } from '@/server/api';
import { adminRoute, audit, scraperError } from '@/server/admin';
import { setScrapeSourceEnabled } from '@/server/scrape';

const Body = z.object({ enabled: z.boolean() }).strict();

/** Turns a source on or off for future scrapes. */
export const PATCH = adminRoute<{ slug: string }>(async ({ req, params, user }) => {
  let slug = params.slug ?? '';
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // Not encoded twice; the check below decides.
  }
  if (!/^[a-z0-9:._-]{1,100}$/.test(slug)) throw notFound('That source');
  const { enabled } = await readBody(req, Body);
  try {
    await setScrapeSourceEnabled(slug, enabled);
  } catch (err) {
    throw scraperError(err);
  }
  await audit(user, 'scrape.source', 'source', slug, `${enabled ? 'Turned on' : 'Turned off'} the ${slug} source`);
  return { ok: true, slug, enabled };
});
