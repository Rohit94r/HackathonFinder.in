import { z } from 'zod';
import { CITIES } from '@hackathonfinder/shared';
import { parseSearchQuery } from '@hackathonfinder/ai';
import { readBody, route } from '@/server/api';
import { DEFAULT_FILTERS, DISTANCE_OPTIONS, PRIZE_OPTIONS, type Filters } from '@/lib/filters';
import { parseSmartQuery } from '@/lib/smartSearch';

const Body = z.object({ q: z.string().trim().min(1).max(300) });

const CITY_VALUES = new Set(['', 'online', ...CITIES.map((c) => c.slug)]);

/**
 * Smart search: "free AI hackathon in Pune this month for beginners" → Explore filters.
 * Uses Claude when configured and falls back to the rule-based parser otherwise.
 */
export const POST = route(
  async ({ req }) => {
    const { q } = await readBody(req, Body);
    const ai = await parseSearchQuery(q);
    if (ai) {
      const { understood, ...rest } = ai;
      // Keep the model's answer inside the values the Explore page understands.
      const filters: Filters = {
        ...DEFAULT_FILTERS,
        ...rest,
        // Already limited to theme slugs by the output schema.
        themes: rest.themes as Filters['themes'],
        city: CITY_VALUES.has(rest.city) ? rest.city : '',
        minPrize: PRIZE_OPTIONS.some((p) => p.value === rest.minPrize) ? rest.minPrize : 0,
        km: DISTANCE_OPTIONS.some((d) => d.value === rest.km) ? rest.km : 0,
      };
      return { filters, understood, engine: 'ai' as const };
    }
    const rules = parseSmartQuery(q);
    return { filters: rules.filters, understood: rules.understood, engine: 'rules' as const };
  },
  { auth: 'none', rate: { limit: 30, windowMs: 60_000, key: 'search' } }
);
