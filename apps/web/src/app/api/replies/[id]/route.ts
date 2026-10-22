import { badRequest, objectId, route } from '@/server/api';
import { deleteReply } from '@/server/community';

/** Removes a reply (its author or an admin). */
export const DELETE = route<{ id: string }>(
  async ({ params, user }) => {
    if (!objectId.safeParse(params.id).success) throw badRequest('Not a valid reply id.');
    return { ok: true, ...(await deleteReply(params.id, user!)) };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60_000, key: 'reply-delete' } }
);
