import { z } from 'zod';
import { Hackathon } from '@hackathonfinder/db';
import { readQuery } from '@/server/api';
import { adminRoute, listingRow, searchRegex } from '@/server/admin';

const Query = z.object({
  q: z.string().trim().max(80).default(''),
  state: z.enum(['live', 'pending', 'rejected', 'removed', 'all']).default('all'),
  source: z.string().trim().max(60).default(''),
  /** City slug, or "online". */
  city: z.string().trim().max(60).default(''),
  featured: z.enum(['1', '']).default(''),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Every listing in any state, searchable by title, organizer or slug. Also used to pick a merge target. */
export const GET = adminRoute(async ({ req }) => {
  const { q, state, source, city, featured, page, limit } = readQuery(req, Query);
  const filter: Record<string, unknown> = {};
  if (state !== 'all') filter.state = state;
  if (source) filter.sources = source;
  if (city === 'online') filter.mode = 'online';
  else if (city) filter.city = city;
  if (featured) filter.featured = true;
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ title: rx }, { organizer: rx }, { slug: rx }, { registrationUrl: rx }];
  }
  const [total, docs] = await Promise.all([
    Hackathon.countDocuments(filter),
    Hackathon.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs.map(listingRow), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
});
