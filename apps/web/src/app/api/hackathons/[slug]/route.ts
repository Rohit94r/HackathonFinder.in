import { notFound, route } from '@/server/api';
import { similarTo } from '@/lib/hackathons';
import { getHackathon } from '@/server/hackathons';

export const GET = route<{ slug: string }>(
  async ({ params }) => {
    const found = await getHackathon(params.slug);
    if (!found) throw notFound('That hackathon');
    return { nowIso: found.nowIso, item: found.item, similar: similarTo(found.item, found.items) };
  },
  { auth: 'none', rate: { limit: 120, windowMs: 60_000 } }
);
