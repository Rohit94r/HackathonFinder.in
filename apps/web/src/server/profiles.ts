import 'server-only';
import {
  Activity,
  connectDb,
  isDbConfigured,
  Reply,
  SavedEvent,
  TeamPost,
  Thread,
  toPublicUser,
  Types,
  User,
  Win,
} from '@hackathonfinder/db';
import type { ThemeSlug } from '@hackathonfinder/shared';
import { addDays, istDayKey, sampleActivityCounts } from '@/components/profile/heatmap';
import { recordStats, type ProfileStory, type PublicProfile } from '@/components/profile/profileTypes';
import { recordItems } from './me';

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
const HEATMAP_DAYS = 371;
const HANDLE = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;

const monthsSince = (date: Date | string | undefined, now: Date) =>
  date ? Math.max(0, Math.round((now.getTime() - new Date(date).getTime()) / MONTH)) : 0;

/** Actions per India-time day from the activity log. */
async function activityHeatmap(userId: Types.ObjectId, todayKey: string, now: Date): Promise<Record<string, number>> {
  const firstKey = addDays(todayKey, -(HEATMAP_DAYS - 1));
  const rows = await Activity.aggregate<{ _id: string; n: number }>([
    { $match: { userId, at: { $gte: new Date(now.getTime() - (HEATMAP_DAYS + 1) * DAY) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$at', timezone: 'Asia/Kolkata' } }, n: { $sum: 1 } } },
  ]);
  const counts: Record<string, number> = {};
  for (const r of rows) if (r._id >= firstKey && r._id <= todayKey) counts[r._id] = r.n;
  return counts;
}

/**
 * Everything the public profile shows for a handle, or null when there's no such
 * student (or the account was deleted or banned). Used by /u/[handle] and its API.
 */
export async function getPublicProfile(handle: string, now: Date = new Date()): Promise<PublicProfile | null> {
  const wanted = handle.trim().toLowerCase();
  if (!HANDLE.test(wanted) || !isDbConfigured()) return null;
  await connectDb();
  const doc = await User.findOne({ handle: wanted, deletedAt: null, banned: { $ne: true } }).lean();
  if (!doc) return null;

  const id = doc._id;
  const live = { authorId: id, deletedAt: null };
  const todayKey = istDayKey(now.getTime());
  const record = recordItems(doc.record);
  const stats = recordStats(record);

  const [threads, replies, wins, teamPosts, storyDocs, tracker, heatmap] = await Promise.all([
    Thread.countDocuments(live),
    Reply.countDocuments(live),
    Win.countDocuments(live),
    TeamPost.countDocuments(live),
    Win.find(live).sort({ createdAt: -1 }).limit(12).lean(),
    SavedEvent.aggregate<{ _id: string; n: number }>([{ $match: { userId: id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    // Sample students have no activity log, so they keep their made-up (but stable) heatmap.
    doc.isSample
      ? Promise.resolve(
          sampleActivityCounts(
            {
              handle: doc.handle,
              joinedMonthsAgo: monthsSince(doc.joinedAt ?? doc.createdAt, now),
              record: record.map((r) => ({ event: r.event, monthsAgo: monthsSince(r.date, now) })),
            },
            todayKey
          )
        )
      : activityHeatmap(id, todayKey, now),
  ]);

  const byStatus = Object.fromEntries(tracker.map((t) => [t._id, t.n])) as Record<string, number | undefined>;
  const tracked = tracker.reduce((sum, t) => sum + t.n, 0);
  const atLeast = (...statuses: string[]) => statuses.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0);

  const stories: ProfileStory[] = storyDocs.map((w) => ({
    slug: w.slug,
    projectName: w.projectName,
    hackathon: w.hackathon,
    hackathonSlug: w.hackathonSlug || undefined,
    city: w.city || undefined,
    result: w.result,
    prize: w.prize ?? '',
    tagline: w.tagline ?? '',
    themes: (w.themes ?? []) as ThemeSlug[],
    cheers: w.cheers ?? 0,
    coverUrl: w.coverUrl || undefined,
    createdAt: new Date(w.createdAt).toISOString(),
  }));

  return {
    user: toPublicUser(doc),
    record,
    stats,
    counts: { threads, replies, wins, teamPosts },
    heatmap,
    todayKey,
    // A hackathon in the record means they registered, shipped and finished it.
    badgeInput: {
      saves: Math.max(tracked, stats.hackathons),
      registered: Math.max(atLeast('registered', 'submitted', 'done'), stats.hackathons),
      submitted: Math.max(atLeast('submitted', 'done'), stats.hackathons),
      done: Math.max(atLeast('done'), stats.hackathons),
      cities: (doc.followedCities ?? []).length,
      teamPosts,
      threads,
      replies,
      podiums: stats.podiums,
      wins: stats.wins,
    },
    stories,
  };
}
