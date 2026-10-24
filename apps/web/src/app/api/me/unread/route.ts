import { route } from '@/server/api';
import { unreadTotal } from '@/server/chat';

/** Unread chat messages, for the badge in the account menu. */
export const GET = route(async ({ user }) => ({ unread: await unreadTotal(user!.id) }), {
  auth: 'required',
  rate: { limit: 120, windowMs: 60_000, key: 'messages-unread' },
});
