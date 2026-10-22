import { readBody, route } from '@/server/api';
import { toggleVote, VoteSchema } from '@/server/community';

/** Upvote a discussion or reply; sending it again takes the vote back. */
export const POST = route(
  async ({ req, user }) => {
    const { targetType, targetId } = await readBody(req, VoteSchema);
    return toggleVote(user!, targetType, targetId);
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000, key: 'vote' } }
);
