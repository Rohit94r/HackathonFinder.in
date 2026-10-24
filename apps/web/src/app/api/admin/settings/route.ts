import { adminRoute, getSettings } from '@/server/admin';

/** What's connected (yes/no only, never a key or secret), the admin accounts and a few totals. */
export const GET = adminRoute(async () => getSettings());
