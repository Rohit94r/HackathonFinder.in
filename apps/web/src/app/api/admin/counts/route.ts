import { adminRoute, getBadgeCounts } from '@/server/admin';

/** Numbers for the admin sidebar: what's waiting for review, open reports, and whether a scrape is running. */
export const GET = adminRoute(async () => getBadgeCounts());
