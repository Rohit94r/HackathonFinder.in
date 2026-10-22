import { adminRoute, getOverview } from '@/server/admin';

/** Counts for the admin overview: listings, queue, reports, users, agent runs and source health. */
export const GET = adminRoute(async () => getOverview());
