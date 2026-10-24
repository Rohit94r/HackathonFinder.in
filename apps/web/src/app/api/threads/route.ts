import { readBody, readQuery, route } from '@/server/api';
import { createThread, listThreads, NewThreadSchema, ThreadQuerySchema } from '@/server/community';

/** Discussions: filter by category, city, hackathon, author or words; sort hot, new or top. */
export const GET = route(
  async ({ req, user }) => listThreads(readQuery(req, ThreadQuerySchema), user),
  { auth: 'optional' }
);

/** Start a discussion. */
export const POST = route(
  async ({ req, user, ip }) => ({ thread: await createThread(user!, await readBody(req, NewThreadSchema), ip) }),
  { auth: 'required', rate: { limit: 5, windowMs: 10 * 60_000, key: 'thread-post' } }
);
