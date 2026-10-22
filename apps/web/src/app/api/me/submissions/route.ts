import { Hackathon, Submission } from '@hackathonfinder/db';
import { route } from '@/server/api';
import { submissionTitle } from '@/server/submissions';

/** The student's own submissions, newest first, with a link once the listing is live. */
export const GET = route(
  async ({ user }) => {
    const subs = await Submission.find({ userId: user!.id }).sort({ createdAt: -1 }).limit(50).lean();
    const ids = subs.map((s) => s.hackathonId).filter(Boolean);
    const listings = ids.length ? await Hackathon.find({ _id: { $in: ids } }).select('slug title state').lean() : [];
    const byId = new Map(listings.map((l) => [String(l._id), l]));
    return {
      items: subs.map((s) => {
        const listing = s.hackathonId ? byId.get(String(s.hackathonId)) : undefined;
        return {
          id: String(s._id),
          kind: s.kind,
          // "processing" is internal; students just see it as in review.
          status: s.status === 'processing' ? 'pending' : s.status,
          title: submissionTitle(s),
          url: s.url ?? '',
          seenOn: s.seenOn ?? '',
          createdAt: s.createdAt,
          reviewNote: s.status === 'rejected' ? s.reviewNote ?? '' : '',
          hackathon: listing && listing.state === 'live' ? { slug: listing.slug, title: listing.title } : null,
        };
      }),
    };
  },
  { auth: 'required' }
);
