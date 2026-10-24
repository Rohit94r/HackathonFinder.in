import { route } from '@/server/api';
import { listConversations } from '@/server/chat';

/** The signed-in student's chats, latest first, with unread counts. */
export const GET = route(async ({ user }) => listConversations(user!.id), {
  auth: 'required',
  rate: { limit: 240, windowMs: 60_000, key: 'messages-list' },
});
