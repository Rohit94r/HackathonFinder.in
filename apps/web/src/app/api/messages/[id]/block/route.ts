import { notFound, objectId, route } from '@/server/api';
import { toggleBlock } from '@/server/chat';

/** Blocks the chat so nobody can send; sending it again unblocks (only for whoever blocked). */
export const POST = route<{ id: string }>(
  async ({ params, user }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That chat');
    return toggleBlock(user!.id, params.id);
  },
  { auth: 'required', rate: { limit: 20, windowMs: 60_000, key: 'messages-block' } }
);
