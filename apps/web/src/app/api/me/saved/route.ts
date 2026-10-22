import { z } from 'zod';
import { Hackathon, logActivity, SavedEvent } from '@hackathonfinder/db';
import { readBody, route } from '@/server/api';

const STATUSES = ['saved', 'registered', 'submitted', 'done'] as const;

/** The student's "My hackathons" tracker: slug → status. */
export const GET = route(
  async ({ user }) => {
    const items = await SavedEvent.find({ userId: user!.id }).sort({ updatedAt: -1 }).lean();
    return { items: items.map((i) => ({ slug: i.hackathonSlug, status: i.status, updatedAt: i.updatedAt })) };
  },
  { auth: 'required' }
);

const Import = z.object({ items: z.record(z.string(), z.enum(STATUSES)) });

/** Moves events saved while signed out (kept in the browser) into the account. */
export const POST = route(
  async ({ req, user }) => {
    const { items } = await readBody(req, Import);
    const slugs = Object.keys(items).slice(0, 200);
    const known = new Set((await Hackathon.find({ slug: { $in: slugs } }).select('slug').lean()).map((h) => h.slug));
    let imported = 0;
    for (const slug of slugs) {
      if (!known.has(slug)) continue;
      // Never downgrade: an account's "registered" beats a browser's "saved".
      const res = await SavedEvent.updateOne(
        { userId: user!.id, hackathonSlug: slug },
        { $setOnInsert: { status: items[slug] } },
        { upsert: true }
      );
      if (res.upsertedCount) {
        imported++;
        await Hackathon.updateOne({ slug }, { $inc: { 'stats.saves': 1 } });
      }
    }
    if (imported) await logActivity(user!.id, 'saved', `${imported} hackathon${imported === 1 ? '' : 's'} from this browser`, '/saved');
    return { imported };
  },
  { auth: 'required', rate: { limit: 10, windowMs: 60_000 } }
);
