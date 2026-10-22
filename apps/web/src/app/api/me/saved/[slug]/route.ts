import { z } from 'zod';
import { Hackathon, logActivity, SavedEvent } from '@hackathonfinder/db';
import { notFound, readBody, route } from '@/server/api';

const Body = z.object({ status: z.enum(['saved', 'registered', 'submitted', 'done']).default('saved') });

/** Saves an event or moves it along the tracker (saved → registered → submitted → done). */
export const PUT = route<{ slug: string }>(
  async ({ req, user, params }) => {
    const { status } = await readBody(req, Body);
    const event = await Hackathon.findOne({ slug: params.slug }).select('title slug').lean();
    if (!event) throw notFound('That hackathon');
    const before = await SavedEvent.findOneAndUpdate(
      { userId: user!.id, hackathonSlug: params.slug },
      { $set: { status } },
      { upsert: true, new: false }
    ).lean();
    if (!before) await Hackathon.updateOne({ slug: params.slug }, { $inc: { 'stats.saves': 1 } });
    if (!before || before.status !== status) await logActivity(user!.id, status, event.title, `/hackathons/${event.slug}`);
    return { slug: params.slug, status };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000 } }
);

export const DELETE = route<{ slug: string }>(
  async ({ user, params }) => {
    const removed = await SavedEvent.findOneAndDelete({ userId: user!.id, hackathonSlug: params.slug });
    if (removed) await Hackathon.updateOne({ slug: params.slug, 'stats.saves': { $gt: 0 } }, { $inc: { 'stats.saves': -1 } });
    return { ok: true };
  },
  { auth: 'required' }
);
