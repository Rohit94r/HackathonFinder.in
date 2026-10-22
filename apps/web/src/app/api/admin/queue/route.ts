import { Hackathon, Submission, User } from '@hackathonfinder/db';
import { adminRoute, listingRow, submissionRow } from '@/server/admin';

/** The review queue: pending listings from the pipeline and pending submissions from people, oldest first. */
export const GET = adminRoute(async () => {
  const [listings, subs] = await Promise.all([
    Hackathon.find({ state: 'pending' }).sort({ createdAt: 1 }).limit(100).lean(),
    Submission.find({ status: { $in: ['pending', 'processing'] } }).sort({ createdAt: 1 }).limit(100).lean(),
  ]);
  const ids = [...new Set(subs.map((s) => s.userId).filter(Boolean).map(String))];
  const users = ids.length ? await User.find({ _id: { $in: ids } }).select('handle name').lean() : [];
  const byId = new Map(users.map((u) => [String(u._id), { handle: u.handle, name: u.name }]));
  return {
    listings: listings.map(listingRow),
    submissions: subs.map((s) => submissionRow(s, byId)),
  };
});
