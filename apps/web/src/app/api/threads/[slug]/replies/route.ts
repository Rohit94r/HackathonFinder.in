import { readBody, route } from '@/server/api';
import { addReply, ReplySchema } from '@/server/community';

/** Reply to a discussion. The thread's author gets a notification. */
export const POST = route<{ slug: string }>(
  async ({ req, params, user, ip }) => {
    const { body } = await readBody(req, ReplySchema);
    return { reply: await addReply(params.slug, user!, body, ip) };
  },
  { auth: 'required', rate: { limit: 15, windowMs: 10 * 60_000, key: 'reply-post' } }
);
