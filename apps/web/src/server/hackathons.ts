import 'server-only';
import { revalidateTag, unstable_cache } from 'next/cache';
import { connectDb, Hackathon, isDbConfigured, toHackathon } from '@hackathonfinder/db';
import { computeStatus, daysUntil, type Hackathon as Listing } from '@hackathonfinder/shared';
import type { HackathonSnapshot, HackathonView } from '@/lib/hackathons';

const DAY = 24 * 60 * 60 * 1000;
// Finished events stay listed (status "completed") this long, so "All events" has history.
const KEEP_FINISHED_DAYS = 60;

function view(h: Listing, now: Date): HackathonView {
  return { ...h, status: computeStatus(h, now), daysToDeadline: daysUntil(h.registrationDeadline, now) };
}

/** Cache tag for the listing documents; see listingsChanged(). */
export const LISTINGS_TAG = 'listings';

/**
 * The live listing documents, read from MongoDB at most every five minutes and shared by every
 * page and visitor (Next's data cache), instead of a full collection read on every request.
 * Admin edits and scrapes clear it at once through listingsChanged(). The cutoff is a day, so the
 * cache key changes once a day rather than every request.
 */
const loadListings = unstable_cache(
  async (cutoffIso: string): Promise<Listing[]> => {
    await connectDb();
    const docs = await Hackathon.find({
      state: 'live',
      // Leftover preview listings (flag "sample") never reach students.
      flags: { $ne: 'sample' },
      endDate: { $gte: new Date(cutoffIso) },
    })
      .sort({ registrationDeadline: 1 })
      .lean();
    return docs.map(toHackathon);
  },
  ['listings-v1'],
  { revalidate: 300, tags: [LISTINGS_TAG] }
);

/** Call after anything adds, edits or removes a listing, so every page shows it straight away. */
export function listingsChanged(): void {
  try {
    revalidateTag(LISTINGS_TAG);
  } catch {
    // Outside a request (e.g. the local scrape scheduler) there is nothing to clear; the cache expires in 5 minutes.
  }
}

/**
 * Every live listing with its status worked out for "now". Statuses are computed per request, so
 * deadlines are exact even when the documents come from the cache. Without a database configured
 * the list is empty: we never show made-up events.
 */
export async function getHackathons(now: Date = new Date()): Promise<HackathonSnapshot> {
  if (!isDbConfigured()) return { nowIso: now.toISOString(), items: [] };
  const cutoff = new Date(now.getTime() - KEEP_FINISHED_DAYS * DAY);
  cutoff.setUTCHours(0, 0, 0, 0);
  const listings = await loadListings(cutoff.toISOString());
  return { nowIso: now.toISOString(), items: listings.map((h) => view(h, now)) };
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
