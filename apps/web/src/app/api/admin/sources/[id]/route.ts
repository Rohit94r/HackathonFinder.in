import { z } from 'zod';
import { AgentRun, Source } from '@hackathonfinder/db';
import { cronProblem } from '@/components/admin/cron';
import { badRequest, notFound, readBody } from '@/server/api';
import { adminRoute, idParam, sourceRow } from '@/server/admin';

const Body = z
  .object({
    enabled: z.boolean().optional(),
    schedule: z.string().trim().min(1).max(100).optional(),
  })
  .refine((v) => v.enabled !== undefined || v.schedule !== undefined, 'Nothing to change.');

/** Turn a source on or off, or change its schedule (cron, India time). */
export const PATCH = adminRoute<{ id: string }>(async ({ req, params }) => {
  const body = await readBody(req, Body);
  if (body.schedule !== undefined) {
    const problem = cronProblem(body.schedule);
    if (problem) throw badRequest('That schedule isn’t valid.', { schedule: problem });
    body.schedule = body.schedule.split(/\s+/).join(' ');
  }
  const source = await Source.findByIdAndUpdate(idParam(params.id, 'That source'), { $set: body }, { new: true }).lean();
  if (!source) throw notFound('That source');
  const queued = await AgentRun.exists({ source: source.slug, status: 'queued' });
  return { source: sourceRow(source, new Set(queued ? [source.slug] : [])) };
});
