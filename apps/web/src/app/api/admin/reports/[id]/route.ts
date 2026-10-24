import { z } from 'zod';
import { Hackathon, Report, Types } from '@hackathonfinder/db';
import { notFound, readBody } from '@/server/api';
import { adminRoute, audit, idParam } from '@/server/admin';

const Body = z
  .object({
    status: z.enum(['open', 'resolved', 'dismissed']),
    note: z.string().trim().max(1000).default(''),
    /** Also take the listing down (state "removed"); its other open reports are resolved too. */
    removeListing: z.boolean().default(false),
  })
  .strict();

/** Resolve or dismiss a report (or reopen it), optionally removing the listing. */
export const PATCH = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const { status, note, removeListing } = await readBody(req, Body);
  const report = await Report.findById(idParam(params.id, 'That report'));
  if (!report) throw notFound('That report');
  const by = new Types.ObjectId(user.id);
  const closed = status === 'open' ? { resolvedBy: undefined, resolvedAt: undefined } : { resolvedBy: by, resolvedAt: new Date() };
  report.set({ status, resolutionNote: note || undefined, ...closed });
  await report.save();

  let removed = false;
  if (removeListing && status === 'resolved') {
    const listing = await Hackathon.findOne({ slug: report.hackathonSlug });
    if (listing && listing.state !== 'removed') {
      listing.state = 'removed';
      listing.flags = [...(listing.flags ?? []), `Removed by @${user.handle} after a “${report.reason}” report${note ? `: ${note}` : ''}`];
      listing.removedReason = (note || `Reported: ${report.reason}`).slice(0, 300);
      listing.removedBy = by;
      listing.removedAt = new Date();
      await listing.save();
      removed = true;
    }
    await Report.updateMany(
      { hackathonSlug: report.hackathonSlug, status: 'open' },
      { $set: { status: 'resolved', resolvedBy: by, resolvedAt: new Date(), resolutionNote: 'Listing removed' } }
    );
  }
  await audit(
    user,
    `report.${status === 'open' ? 'reopen' : status === 'resolved' ? 'resolve' : 'dismiss'}`,
    'report',
    String(report._id),
    `${status === 'open' ? 'Reopened' : status === 'resolved' ? 'Resolved' : 'Dismissed'} a “${report.reason}” report on ${report.hackathonSlug}${removed ? ' and removed the listing' : ''}${note ? `: ${note}` : ''}`
  );
  return { ok: true, removed };
});
