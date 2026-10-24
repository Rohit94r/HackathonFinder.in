import 'server-only';
import { connectDb, Hackathon, isDbConfigured, toHackathon } from '@hackathonfinder/db';
import { computeStatus, daysUntil, type Hackathon as Listing } from '@hackathonfinder/shared';
import type { HackathonSnapshot, HackathonView } from '@/lib/hackathons';

const DAY = 24 * 60 * 60 * 1000;
// Finished events stay listed (status "completed") this long, so "All events" has history.
const KEEP_FINISHED_DAYS = 60;

function view(h: Listing, now: Date): HackathonView {
  return { ...h, status: computeStatus(h, now), daysToDeadline: daysUntil(h.registrationDeadline, now) };
}

/**
 * Every live listing with its status worked out for "now", from MongoDB. Without a
 * database configured the list is empty: we never show made-up events.
 */
export async function getHackathons(now: Date = new Date()): Promise<HackathonSnapshot> {
  if (!isDbConfigured()) return { nowIso: now.toISOString(), items: [] };
  await connectDb();
  // Leftover preview listings (flag "sample") never reach students.
  const docs = await Hackathon.find({
    state: 'live',
    flags: { $ne: 'sample' },
    endDate: { $gte: new Date(now.getTime() - KEEP_FINISHED_DAYS * DAY) },
  })
    .sort({ registrationDeadline: 1 })
    .lean();
  return { nowIso: now.toISOString(), items: docs.map((d) => view(toHackathon(d), now)) };
}

/** One listing by slug, plus the full list (for "similar" and related sections). */
export async function getHackathon(slug: string, now: Date = new Date()) {
  const snapshot = await getHackathons(now);
  let item = snapshot.items.find((h) => h.slug === slug);
  // Older finished events aren't in the snapshot, but their pages should still open.
  if (!item && isDbConfigured()) {
    const doc = await Hackathon.findOne({ slug, state: 'live', flags: { $ne: 'sample' } }).lean();
    if (doc) item = view(toHackathon(doc), now);
  }
  return item ? { ...snapshot, item } : null;
}

/** Counts a view of an event page. Fire-and-forget; never blocks rendering. */
export function countView(slug: string): void {
  if (!isDbConfigured()) return;
  connectDb()
    .then(() => Hackathon.updateOne({ slug }, { $inc: { 'stats.views': 1 } }))
    .catch(() => {});
}
