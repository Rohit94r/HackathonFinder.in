import { z } from 'zod';
import { notFound, objectId, readBody, route } from '@/server/api';
import { answerRequest } from '@/server/teams';

const Body = z.object({ status: z.enum(['accepted', 'declined', 'withdrawn']) });

/** The team's author accepts or declines; the student who asked can withdraw. */
export const PATCH = route<{ id: string }>(
  async ({ req, params, user }) => {
    if (!objectId.safeParse(params.id).success) throw notFound('That request');
    const { status } = await readBody(req, Body);
    return { request: await answerRequest(user!, params.id, status) };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000, key: 'team-request-answer' } }
);
