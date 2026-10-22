import { z } from 'zod';
import { Notification } from '@hackathonfinder/db';
import { objectId, readBody, route } from '@/server/api';

const Body = z.object({ ids: z.array(objectId).max(100).optional() });

/** Marks notifications as read: the given ids, or all of them when `ids` is left out. */
export const POST = route(
  async ({ req, user }) => {
    // An empty POST (no JSON body) means "mark all".
    const { ids } = req.headers.get('content-type')?.includes('json') ? await readBody(req, Body) : { ids: undefined };
    const filter: Record<string, unknown> = { userId: user!.id, readAt: null };
    if (ids) filter._id = { $in: ids };
    const res = ids?.length === 0 ? { modifiedCount: 0 } : await Notification.updateMany(filter, { $set: { readAt: new Date() } });
    const unread = await Notification.countDocuments({ userId: user!.id, readAt: null });
    return { updated: res.modifiedCount, unread };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000 } }
);
