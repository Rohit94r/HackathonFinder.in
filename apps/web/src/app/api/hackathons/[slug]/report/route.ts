import { z } from 'zod';
import { Hackathon, Report } from '@hackathonfinder/db';
import { notFound, readBody, route } from '@/server/api';

const Body = z.object({
  reason: z.enum(['wrong-details', 'scam', 'expired', 'duplicate', 'broken-link', 'other']),
  details: z.string().trim().max(1000).default(''),
});

/** "Report this listing". Anyone can report; signed-in reports carry the student's id. */
export const POST = route<{ slug: string }>(
  async ({ req, params, user }) => {
    const body = await readBody(req, Body);
    if (!(await Hackathon.exists({ slug: params.slug }))) throw notFound('That hackathon');
    await Report.create({ hackathonSlug: params.slug, userId: user?.id, reason: body.reason, details: body.details });
    return { ok: true };
  },
  { auth: 'optional', rate: { limit: 5, windowMs: 60 * 60 * 1000, key: 'report' } }
);
