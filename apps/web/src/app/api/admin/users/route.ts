import { z } from 'zod';
import { User } from '@hackathonfinder/db';
import { readQuery } from '@/server/api';
import { adminRoute, searchRegex, userCounts, userRow } from '@/server/admin';

const SORTS = {
  joined: { createdAt: -1 },
  login: { lastLoginAt: -1 },
  name: { name: 1 },
} as const;

const Query = z.object({
  q: z.string().trim().max(80).default(''),
  role: z.enum(['student', 'organizer', 'admin', 'all']).default('all'),
  /** real: signed-up people. sample: seeded students. banned, deleted: what they say. */
  show: z.enum(['real', 'sample', 'banned', 'deleted', 'all']).default('real'),
  sort: z.enum(['joined', 'login', 'name']).default('joined'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Accounts, searchable by name, handle, email, college or city, with how much each has posted. */
export const GET = adminRoute(async ({ req }) => {
  const { q, role, show, sort, page, limit } = readQuery(req, Query);
  const filter: Record<string, unknown> = {};
  if (show === 'deleted') filter.deletedAt = { $ne: null };
  else filter.deletedAt = null;
  if (show === 'real') filter.isSample = { $ne: true };
  if (show === 'sample') filter.isSample = true;
  if (show === 'banned') filter.banned = true;
  if (role !== 'all') filter.role = role;
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ name: rx }, { handle: rx }, { email: rx }, { college: rx }, { city: rx }];
  }
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ ...SORTS[sort], _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);
  const countsFor = await userCounts(users.map((u) => String(u._id)));
  return {
    items: users.map((u) => ({ ...userRow(u), counts: countsFor(String(u._id)) })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
});
