import { z } from 'zod';
import { User } from '@hackathonfinder/db';
import { readQuery } from '@/server/api';
import { adminRoute, searchRegex, userRow } from '@/server/admin';

const Query = z.object({
  q: z.string().trim().max(80).default(''),
  role: z.enum(['student', 'organizer', 'admin', 'all']).default('all'),
  banned: z.enum(['1', '']).default(''),
  sample: z.enum(['1', '']).default(''),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Accounts, searchable by name, handle or email. Seeded sample students are hidden unless asked for. */
export const GET = adminRoute(async ({ req }) => {
  const { q, role, banned, sample, page, limit } = readQuery(req, Query);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (!sample) filter.isSample = { $ne: true };
  if (role !== 'all') filter.role = role;
  if (banned) filter.banned = true;
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ name: rx }, { handle: rx }, { email: rx }];
  }
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: users.map(userRow), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
});
