import { z } from 'zod';
import { AgentRun } from '@hackathonfinder/db';
import { readQuery } from '@/server/api';
import { adminRoute, runRow } from '@/server/admin';

const Query = z.object({
  source: z.string().trim().max(100).default(''),
  status: z.enum(['queued', 'running', 'success', 'partial', 'failed', 'skipped', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Recent agent runs, newest first, with counts, errors and the end of the log. */
export const GET = adminRoute(async ({ req }) => {
  const { source, status, limit } = readQuery(req, Query);
  const filter: Record<string, unknown> = {};
  if (source) filter.source = source;
  if (status !== 'all') filter.status = status;
  const runs = await AgentRun.find(filter).sort({ startedAt: -1 }).limit(limit).lean();
  return { items: runs.map(runRow) };
});
