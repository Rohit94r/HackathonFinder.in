import { AgentRun, Source } from '@hackathonfinder/db';
import { notFound } from '@/server/api';
import { adminRoute, idParam } from '@/server/admin';

/**
 * "Run now": queues a Scout run for this source. The agents scheduler
 * (`pnpm agents:schedule`) picks up queued runs; nothing runs inside the website.
 */
export const POST = adminRoute<{ id: string }>(
  async ({ params }) => {
    const source = await Source.findById(idParam(params.id, 'That source')).select('slug').lean();
    if (!source) throw notFound('That source');
    const existing = await AgentRun.findOne({ agent: 'scout', source: source.slug, status: 'queued' }).select('_id').lean();
    if (existing) return { id: String(existing._id), status: 'queued', alreadyQueued: true };
    const run = await AgentRun.create({ agent: 'scout', source: source.slug, status: 'queued', trigger: 'api', startedAt: new Date() });
    return { id: String(run._id), status: 'queued', alreadyQueued: false };
  },
  { limit: 30, windowMs: 60_000 }
);
