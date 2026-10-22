import { z } from 'zod';
import { notFound, objectId, readBody, route } from '@/server/api';
import { Message, requestToJoin } from '@/server/teams';

const Body = z.object({ message: Message });

/** Asks to join a team. One request per student per post. */
export const POST = route<{ id: string }>(
  async ({ req, params, user }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That team post');
    const { message } = await readBody(req, Body);
    return { request: await requestToJoin(user!, params.id, message) };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60 * 60_000, key: 'team-request' } }
);
