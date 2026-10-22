import { z } from 'zod';
import { route, readQuery } from '@/server/api';
import { applyFilters, parseFilters } from '@/lib/filters';
import { getHackathons } from '@/server/hackathons';

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/**
 * Listings with the same filters as the Explore page (q, city, mode, type, theme,
 * status, fee, team, eligibility, beginner, prize, within, km, sort), plus lat/lng
 * for distance filtering and "nearest" sorting. Paged.
 */
export const GET = route(
  async ({ req }) => {
    const { lat, lng, page, limit } = readQuery(req, Query.passthrough());
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = parseFilters(params);
    const origin = lat !== undefined && lng !== undefined ? { lat, lng } : null;
    const { items, nowIso } = await getHackathons();
    const results = applyFilters(items, filters, origin);
    const start = (page - 1) * limit;
    return {
      nowIso,
      total: results.length,
      page,
      pages: Math.max(1, Math.ceil(results.length / limit)),
      filters,
      items: results.slice(start, start + limit),
    };
  },
  { auth: 'none', rate: { limit: 120, windowMs: 60_000 } }
);
