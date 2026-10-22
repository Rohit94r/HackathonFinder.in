import { z } from 'zod';
import { notFound, objectId, readBody, route } from '@/server/api';
import { answerInvite } from '@/server/teams';

const Body = z.object({ status: z.enum(['accepted', 'declined', 'withdrawn']) });

/** The invited student accepts or declines; the sender can withdraw. */
export const PATCH = route<{ id: string }>(
  async ({ req, params, user }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That invite');
    const { status } = await readBody(req, Body);
    return { invite: await answerInvite(user!, params.id, status) };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000, key: 'team-invite-answer' } }
);
