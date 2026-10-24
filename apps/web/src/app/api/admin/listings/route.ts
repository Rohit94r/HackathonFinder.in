import { z } from 'zod';
import { Hackathon } from '@hackathonfinder/db';
import { readQuery } from '@/server/api';
import { adminRoute, listingRow, searchRegex, withSubmitters } from '@/server/admin';

const SORTS = {
  updated: { updatedAt: -1 },
  created: { createdAt: -1 },
  deadline: { registrationDeadline: 1 },
  start: { startDate: 1 },
  views: { 'stats.views': -1 },
  clicks: { 'stats.registerClicks': -1 },
  title: { title: 1 },
} as const;

const slugLike = z.string().trim().max(60).regex(/^[a-z0-9:._-]*$/, 'Not a valid value.');

const Query = z.object({
  q: z.string().trim().max(80).default(''),
  state: z.enum(['live', 'pending', 'rejected', 'removed', 'all']).default('all'),
  source: slugLike.default(''),
  mode: z.enum(['online', 'offline', 'hybrid', '']).default(''),
  /** City slug, or "online". */
  city: slugLike.default(''),
  image: z.enum(['1', '0', '']).default(''),
  qr: z.enum(['1', '']).default(''),
  featured: z.enum(['1', '']).default(''),
  sort: z.enum(Object.keys(SORTS) as [keyof typeof SORTS, ...(keyof typeof SORTS)[]]).default('updated'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Every listing in any state, with filters, counts per state, and who shared it. Also used to pick a merge target. */
export const GET = adminRoute(async ({ req }) => {
  const { q, state, source, mode, city, image, qr, featured, sort, page, limit } = readQuery(req, Query);
  const and: Record<string, unknown>[] = [];
  if (source) and.push({ sources: source });
  if (mode) and.push({ mode });
  if (city === 'online') and.push({ mode: 'online' });
  else if (city) and.push({ city });
  if (image === '1') and.push({ imageUrl: { $exists: true, $nin: [null, ''] } });
  if (image === '0') and.push({ $or: [{ imageUrl: { $exists: false } }, { imageUrl: { $in: [null, ''] } }] });
  if (qr) and.push({ registrationVia: 'qr' });
  if (featured) and.push({ featured: true });
  if (q) {
    const rx = searchRegex(q);
    and.push({ $or: [{ title: rx }, { organizer: rx }, { slug: rx }, { registrationUrl: rx }, { cityName: rx }] });
  }
  const base = and.length ? { $and: and } : {};
  const filter = state === 'all' ? base : { ...base, state };
  const [total, docs, byState] = await Promise.all([
    Hackathon.countDocuments(filter),
    Hackathon.find(filter)
      .sort({ ...SORTS[sort], _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Hackathon.aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: '$state', n: { $sum: 1 } } }]),
  ]);
  const counts: Record<string, number> = { all: 0, live: 0, pending: 0, rejected: 0, removed: 0 };
  for (const s of byState) {
    counts[s._id] = s.n;
    counts.all += s.n;
  }
  return { items: await withSubmitters(docs.map(listingRow)), counts, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
});
