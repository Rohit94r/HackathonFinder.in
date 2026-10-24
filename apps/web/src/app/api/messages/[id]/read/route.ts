import { notFound, objectId, route } from '@/server/api';
import { markConversationRead } from '@/server/chat';

/** Marks the chat read; returns the student's total unread count. */
export const POST = route<{ id: string }>(
  async ({ params, user }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That chat');
    return markConversationRead(user!.id, params.id);
  },
  { auth: 'required', rate: { limit: 120, windowMs: 60_000, key: 'messages-mark-read' } }
);
