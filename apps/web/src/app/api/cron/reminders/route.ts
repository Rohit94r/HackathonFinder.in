import { route } from '@/server/api';
import { assertCron } from '@/server/cron';
import { sendDeadlineReminders } from '@/server/reminders';

// Run every few hours (Vercel Cron, GitHub Actions or the agents scheduler can call it).
const handler = route(
  async ({ req }) => {
    assertCron(req);
    return sendDeadlineReminders();
  },
  { auth: 'none' }
);

export const GET = handler;
export const POST = handler;
