import { AgentRun, Source } from '@hackathonfinder/db';
import { notFound } from '@/server/api';
import { adminRoute, audit, idParam } from '@/server/admin';

/**
 * "Run now" for one source (older Scout flow): queues a Scout run that the agents
 * scheduler (`pnpm agents:schedule`) picks up. The admin Scraper page uses /api/admin/scrape instead.
 */
export const POST = adminRoute<{ id: string }>(
  async ({ params, user }) => {
    const source = await Source.findById(idParam(params.id, 'That source')).select('slug name').lean();
    if (!source) throw notFound('That source');
    const existing = await AgentRun.findOne({ agent: 'scout', source: source.slug, status: 'queued' }).select('_id').lean();
    if (existing) return { id: String(existing._id), status: 'queued', alreadyQueued: true };
    const run = await AgentRun.create({ agent: 'scout', source: source.slug, status: 'queued', trigger: 'api', startedAt: new Date() });
    await audit(user, 'source.run', 'source', source.slug, `Queued a Scout run for ${source.name}`);
    return { id: String(run._id), status: 'queued', alreadyQueued: false };
  },
  { limit: 30, windowMs: 60_000 }
);
