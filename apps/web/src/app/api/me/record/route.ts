import { User } from '@hackathonfinder/db';
import { badRequest, notFound, readBody, route } from '@/server/api';
import { recordItems } from '@/server/me';
import { checkListing, MAX_RECORDS, RecordFields } from './fields';

/** Adds a hackathon to the student's record (it feeds the results ring, stats and badges). */
export const POST = route(
  async ({ req, user }) => {
    const body = await readBody(req, RecordFields);
    const hackathonSlug = await checkListing(body.hackathonSlug);
    const doc = await User.findOneAndUpdate(
      // Only while there's room, so two quick adds can't go over the limit.
      { _id: user!.id, deletedAt: null, [`record.${MAX_RECORDS - 1}`]: { $exists: false } },
      { $push: { record: { event: body.event, hackathonSlug: hackathonSlug || undefined, result: body.result, project: body.project ?? '', date: body.date } } },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) {
      if (await User.exists({ _id: user!.id, deletedAt: null })) throw badRequest(`Your record can hold up to ${MAX_RECORDS} hackathons.`);
      throw notFound('Your account');
    }
    const record = recordItems(doc.record);
    const added = doc.record[doc.record.length - 1];
    return { item: record.find((r) => r.id === String(added?._id)), record };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60_000 } }
);
