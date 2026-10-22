import { z } from 'zod';
import { CITIES } from '@hackathonfinder/shared';
import { User } from '@hackathonfinder/db';
import { readBody, route } from '@/server/api';

const CITY_SLUGS = CITIES.map((c) => c.slug);

const Body = z.object({
  /** Replace the whole list (follow order matters for the shortlist). */
  cities: z.array(z.string().refine((s) => CITY_SLUGS.includes(s), 'Unknown city.')).max(CITIES.length).optional(),
  /** Or add/remove one. */
  follow: z.string().optional(),
  unfollow: z.string().optional(),
  /** Merge cities followed while signed out. */
  import: z.array(z.string()).max(CITIES.length).optional(),
});

export const GET = route(
  async ({ user }) => {
    const doc = await User.findById(user!.id).select('followedCities').lean();
    return { cities: doc?.followedCities ?? [] };
  },
  { auth: 'required' }
);

export const PUT = route(
  async ({ req, user }) => {
    const body = await readBody(req, Body);
    const doc = await User.findById(user!.id).select('followedCities');
    if (!doc) return { cities: [] };
    let cities = doc.followedCities ?? [];
    if (body.cities) cities = body.cities;
    if (body.import) cities = [...cities, ...body.import.filter((c) => CITY_SLUGS.includes(c) && !cities.includes(c))];
    if (body.follow && CITY_SLUGS.includes(body.follow) && !cities.includes(body.follow)) cities = [...cities, body.follow];
    if (body.unfollow) cities = cities.filter((c) => c !== body.unfollow);
    doc.followedCities = [...new Set(cities)];
    await doc.save();
    return { cities: doc.followedCities };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000 } }
);
