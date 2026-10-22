import { AgentRun, Source } from '@hackathonfinder/db';
import { adminRoute, sourceRow } from '@/server/admin';

/** Every source the Scout checks, with health, last run and whether a run is already queued. */
export const GET = adminRoute(async () => {
  const [sources, queued] = await Promise.all([
    Source.find().sort({ kind: 1, name: 1 }).lean(),
    AgentRun.distinct('source', { status: 'queued' }),
  ]);
  const queuedSet = new Set(queued.filter(Boolean).map(String));
  const health = { ok: 0, degraded: 0, failing: 0, blocked: 0, unknown: 0 };
  for (const s of sources) health[s.health ?? 'unknown']++;
  return { sources: sources.map((s) => sourceRow(s, queuedSet)), health };
});
