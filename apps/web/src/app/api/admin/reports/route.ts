import { z } from 'zod';
import { Hackathon, Report, User } from '@hackathonfinder/db';
import { readQuery } from '@/server/api';
import { adminRoute } from '@/server/admin';

const Query = z.object({
  status: z.enum(['open', 'resolved', 'dismissed', 'all']).default('open'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

/** "Report this listing" reports with the listing they're about, newest first. */
export const GET = adminRoute(async ({ req }) => {
  const { status, limit } = readQuery(req, Query);
  const filter = status === 'all' ? {} : { status };
  const [reports, counts] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Report.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const slugs = [...new Set(reports.map((r) => r.hackathonSlug))];
  const userIds = [...new Set(reports.flatMap((r) => [r.userId, r.resolvedBy]).filter(Boolean).map(String))];
  const [listings, users] = await Promise.all([
    Hackathon.find({ slug: { $in: slugs } }).select('slug title state registrationUrl').lean(),
    User.find({ _id: { $in: userIds } }).select('handle name').lean(),
  ]);
  const bySlug = new Map(listings.map((l) => [l.slug, l]));
  const byUser = new Map(users.map((u) => [String(u._id), { handle: u.handle, name: u.name }]));
  const openBySlug = new Map<string, number>();
  for (const r of reports) if (r.status === 'open') openBySlug.set(r.hackathonSlug, (openBySlug.get(r.hackathonSlug) ?? 0) + 1);
  return {
    counts: Object.fromEntries(['open', 'resolved', 'dismissed'].map((s) => [s, counts.find((c) => c._id === s)?.n ?? 0])),
    items: reports.map((r) => {
      const l = bySlug.get(r.hackathonSlug);
      return {
        id: String(r._id),
        reason: r.reason,
        details: r.details ?? '',
        status: r.status,
        createdAt: r.createdAt,
        reporter: r.userId ? byUser.get(String(r.userId)) ?? null : null,
        resolvedBy: r.resolvedBy ? byUser.get(String(r.resolvedBy)) ?? null : null,
        resolvedAt: r.resolvedAt ?? null,
        resolutionNote: r.resolutionNote ?? '',
        hackathonSlug: r.hackathonSlug,
        listing: l ? { id: String(l._id), slug: l.slug, title: l.title, state: l.state, registrationUrl: l.registrationUrl } : null,
        openOnListing: openBySlug.get(r.hackathonSlug) ?? 0,
      };
    }),
  };
});
