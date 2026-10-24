import { z } from 'zod';
import { readQuery } from '@/server/api';
import { adminRoute } from '@/server/admin';
import { hackathonFunnel, previousRange, resolveRange, trafficBreakdowns, trafficSeries, trafficSummary } from '@/server/analytics';

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-10-24.')
  .optional();

const Query = z.object({
  range: z.enum(['today', '7d', '30d', '90d', 'custom']).default('7d'),
  from: day,
  to: day,
});

/** Traffic for a range (India time): summary vs the period before, the chart, top lists and the per-hackathon funnel. */
export const GET = adminRoute(
  async ({ req }) => {
    const q = readQuery(req, Query);
    const range = resolveRange(q.range, q.from, q.to);
    const prev = previousRange(range);
    const [summary, previous, series, breakdowns, funnel] = await Promise.all([
      trafficSummary(range.from, range.to),
      trafficSummary(prev.from, prev.to),
      trafficSeries(range),
      trafficBreakdowns(range.from, range.to, 15, 100),
      hackathonFunnel(range.from, range.to, 100),
    ]);
    return { range: { key: range.key, label: range.label, from: range.from, to: range.to, bucket: range.bucket }, summary, previous, series, breakdowns, funnel };
  },
  { limit: 60, windowMs: 60_000 }
);
