import { User } from '@hackathonfinder/db';
import { badRequest, notFound, objectId, readBody, route } from '@/server/api';
import { recordItems } from '@/server/me';
import { checkListing, RecordFields } from '../fields';

type Params = { id: string };

function recordId(id: string): string {
  if (!objectId.safeParse(id).success) throw notFound('That hackathon in your record');
  return id;
}

/** Changes one entry in the student's record. Send only the fields that change. */
export const PATCH = route<Params>(
  async ({ req, params, user }) => {
    const id = recordId(params.id);
    const body = await readBody(req, RecordFields.partial());
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    if (body.event !== undefined) set['record.$.event'] = body.event;
    if (body.result !== undefined) set['record.$.result'] = body.result;
    if (body.project !== undefined) set['record.$.project'] = body.project;
    if (body.date !== undefined) set['record.$.date'] = body.date;
    if (body.hackathonSlug !== undefined) {
      const slug = await checkListing(body.hackathonSlug);
      if (slug) set['record.$.hackathonSlug'] = slug;
      else unset['record.$.hackathonSlug'] = 1;
    }
    if (!Object.keys(set).length && !Object.keys(unset).length) throw badRequest('Nothing to change.');

    const doc = await User.findOneAndUpdate(
      { _id: user!.id, deletedAt: null, 'record._id': id },
      { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) throw notFound('That hackathon in your record');
    const record = recordItems(doc.record);
    return { item: record.find((r) => r.id === id), record };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000 } }
);

export const DELETE = route<Params>(
  async ({ params, user }) => {
    const id = recordId(params.id);
    const doc = await User.findOneAndUpdate(
      { _id: user!.id, deletedAt: null, 'record._id': id },
      { $pull: { record: { _id: id } } },
      { new: true }
    ).lean();
    if (!doc) throw notFound('That hackathon in your record');
    return { ok: true, record: recordItems(doc.record) };
  },
  { auth: 'required', rate: { limit: 60, windowMs: 60_000 } }
);
