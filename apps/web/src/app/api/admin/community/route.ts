import { z } from 'zod';
import { readQuery } from '@/server/api';
import { adminRoute, listCommunity } from '@/server/admin';

const Query = z.object({
  tab: z.enum(['threads', 'replies', 'teams', 'wins', 'flags']).default('threads'),
  state: z.enum(['live', 'removed', 'all']).default('all'),
  q: z.string().trim().max(80).default(''),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** The latest threads, replies, team posts, winning stories or bad-word filter hits, newest first. */
export const GET = adminRoute(async ({ req }) => {
  const { tab, ...opts } = readQuery(req, Query);
  return listCommunity(tab, opts);
});
