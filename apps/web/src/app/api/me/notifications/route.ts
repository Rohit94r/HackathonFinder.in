import { z } from 'zod';
import { Notification } from '@hackathonfinder/db';
import { readQuery, route } from '@/server/api';

const Query = z.object({
  /** "1" lists unread ones only. */
  unread: z.enum(['0', '1', 'true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  /** Older than this (the last item's createdAt), for "Load more". */
  before: z.coerce.date().optional(),
});

/** The student's notifications, newest first, plus how many are unread (for the bell). */
export const GET = route(
  async ({ req, user }) => {
    const q = readQuery(req, Query);
    const filter: Record<string, unknown> = { userId: user!.id };
    if (q.unread === '1' || q.unread === 'true') filter.readAt = null;
    if (q.before) filter.createdAt = { $lt: q.before };

    const [docs, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(q.limit + 1)
        .lean(),
      Notification.countDocuments({ userId: user!.id, readAt: null }),
    ]);
    return {
      items: docs.slice(0, q.limit).map((n) => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        body: n.body ?? '',
        href: n.href,
        read: Boolean(n.readAt),
        createdAt: n.createdAt,
      })),
      unread,
      hasMore: docs.length > q.limit,
    };
  },
  { auth: 'required', rate: { limit: 120, windowMs: 60_000 } }
);
