import { Activity } from '@hackathonfinder/db';
import { route } from '@/server/api';

const DAY = 24 * 60 * 60 * 1000;

/** The student's activity for the last year (heatmap, streaks, recent list), newest first. */
export const GET = route(
  async ({ user }) => {
    const since = new Date(Date.now() - 372 * DAY);
    const items = await Activity.find({ userId: user!.id, at: { $gte: since } })
      .sort({ at: -1 })
      .limit(2000)
      .lean();
    return {
      items: items.map((a) => ({ id: String(a._id), type: a.type, label: a.label, href: a.href, at: a.at })),
    };
  },
  { auth: 'required' }
);
