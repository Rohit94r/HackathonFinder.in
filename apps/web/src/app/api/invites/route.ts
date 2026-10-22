import { z } from 'zod';
import { objectId, readBody, route } from '@/server/api';
import { Message, sendInvite } from '@/server/teams';

const Body = z.object({
  toHandle: z.string().trim().toLowerCase().min(1, 'Pick a student to invite.').max(40),
  /** One of the sender's own open team posts. */
  postId: objectId.optional(),
  message: Message,
});

/** Invites another student to team up. One invite per pair of students. */
export const POST = route(
  async ({ req, user }) => {
    const body = await readBody(req, Body);
    return { invite: await sendInvite(user!, body) };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60 * 60_000, key: 'team-invite' } }
);
