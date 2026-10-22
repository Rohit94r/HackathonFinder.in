import { route } from '@/server/api';
import { assertCron } from '@/server/cron';
import { sendWeeklyDigest } from '@/server/digest';

// Run every Monday morning IST. Safe to call more often: each subscriber gets at most one a week.
const handler = route(
  async ({ req }) => {
    assertCron(req);
    return sendWeeklyDigest();
  },
  { auth: 'none' }
);

export const GET = handler;
export const POST = handler;
