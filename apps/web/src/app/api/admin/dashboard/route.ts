import { adminRoute, getDashboard } from '@/server/admin';

/** The admin home: traffic for today / 7 / 30 days, the daily chart, top lists, and what needs attention. */
export const GET = adminRoute(async () => getDashboard(), { limit: 60, windowMs: 60_000 });
