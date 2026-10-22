import { z } from 'zod';
import { Submission, User } from '@hackathonfinder/db';
import { readQuery } from '@/server/api';
import { adminRoute, searchRegex, submissionRow } from '@/server/admin';

const Query = z.object({
  status: z.enum(['pending', 'reviewed', 'approved', 'merged', 'rejected', 'all']).default('all'),
  kind: z.enum(['quick', 'organizer', 'extension', 'all']).default('all'),
  q: z.string().trim().max(80).default(''),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Every submission (reviewed or not), newest first, for the review history. */
export const GET = adminRoute(async ({ req }) => {
  const { status, kind, q, page, limit } = readQuery(req, Query);
  const filter: Record<string, unknown> = {};
  if (status === 'pending') filter.status = { $in: ['pending', 'processing'] };
  else if (status === 'reviewed') filter.status = { $in: ['approved', 'merged', 'rejected'] };
  else if (status !== 'all') filter.status = status;
  if (kind !== 'all') filter.kind = kind;
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ title: rx }, { url: rx }, { message: rx }, { email: rx }, { 'fields.title': rx }, { 'extracted.title': rx }];
  }
  const [total, subs] = await Promise.all([
    Submission.countDocuments(filter),
    Submission.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  const ids = [...new Set(subs.map((s) => s.userId).filter(Boolean).map(String))];
  const users = ids.length ? await User.find({ _id: { $in: ids } }).select('handle name').lean() : [];
  const byId = new Map(users.map((u) => [String(u._id), { handle: u.handle, name: u.name }]));
  return { items: subs.map((s) => submissionRow(s, byId)), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
});
