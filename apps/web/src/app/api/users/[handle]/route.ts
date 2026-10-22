import { notFound, route } from '@/server/api';
import { getPublicProfile } from '@/server/profiles';

/** A student's public profile: record, stats, counts, heatmap and badge inputs. */
export const GET = route<{ handle: string }>(
  async ({ params }) => {
    const profile = await getPublicProfile(decodeURIComponent(params.handle ?? ''));
    if (!profile) throw notFound('That profile');
    return profile;
  },
  { auth: 'none', rate: { limit: 120, windowMs: 60_000, key: 'users-profile' } }
);
