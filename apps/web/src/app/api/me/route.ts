import { z } from 'zod';
import { CITIES } from '@hackathonfinder/shared';
import {
  Activity,
  AuthToken,
  DigestSubscriber,
  Invite,
  Notification,
  notify,
  SavedEvent,
  TeamPost,
  TeamRequest,
  User,
} from '@hackathonfinder/db';
import { ApiError, badRequest, notFound, readBody, route } from '@/server/api';
import { loadMe } from '@/server/me';
import { isReservedHandle } from '@/server/users';

const CITY_SLUGS = CITIES.map((c) => c.slug);
const url = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Use a full link starting with https://');

const Patch = z.object({
  name: z.string().trim().min(2, 'Add your name.').max(80).optional(),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/, 'Use 2–30 letters, numbers or dashes.')
    .optional(),
  about: z.string().trim().max(80).optional(),
  college: z.string().trim().max(120).optional(),
  city: z
    .string()
    .trim()
    .refine((v) => v === '' || CITY_SLUGS.includes(v), 'Pick a city from the list.')
    .optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  bio: z.string().trim().max(280).optional(),
  github: url.optional(),
  linkedin: url.optional(),
  lookingForTeam: z.boolean().optional(),
  image: url.optional(),
  onboarded: z.boolean().optional(),
  /** Email preferences; send only the ones that change. */
  prefs: z
    .object({ reminders: z.boolean(), digest: z.boolean(), teamEmails: z.boolean() })
    .partial()
    .strict()
    .optional(),
});

/** The signed-in student's account, or { user: null } when signed out. */
export const GET = route(async ({ user }) => ({ user: user ? await loadMe(user.id) : null }), { auth: 'optional' });

/** Updates profile fields. Changing the handle checks it's free. */
export const PATCH = route(
  async ({ req, user }) => {
    const { prefs, ...body } = await readBody(req, Patch);
    if (body.handle) {
      if (isReservedHandle(body.handle) || body.handle.startsWith('deleted-')) {
        throw badRequest('That handle is reserved. Try another.', { handle: 'That handle is reserved.' });
      }
      const taken = await User.exists({ handle: body.handle, _id: { $ne: user!.id } });
      if (taken) throw new ApiError(409, 'conflict', 'That handle is taken. Try another.', { handle: 'That handle is taken.' });
    }
    const before = await User.findOne({ _id: user!.id, deletedAt: null }).select('onboarded').lean();
    if (!before) throw notFound('Your account');

    // Dotted keys, so changing one preference leaves the others alone.
    const set: Record<string, unknown> = { ...body };
    for (const [key, value] of Object.entries(prefs ?? {})) set[`prefs.${key}`] = value;
    await User.updateOne({ _id: user!.id }, { $set: set }, { runValidators: true });

    if (body.onboarded && !before.onboarded) {
      await notify(
        user!.id,
        'system',
        'Welcome to HackathonFinder!',
        'Save a hackathon near you to start your streak. You’ll get reminders before its deadline.',
        '/near-me'
      );
    }
    return { user: await loadMe(user!.id) };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60_000 } }
);

const Delete = z.object({ confirm: z.literal('DELETE', { error: 'Type DELETE to confirm.' }) });

/** A free "deleted-…" handle from the end of the id. */
async function deletedHandle(id: string): Promise<string> {
  for (const n of [6, 10, 14, 22]) {
    const candidate = `deleted-${id.slice(-n)}`;
    if (!(await User.exists({ handle: candidate, _id: { $ne: id } }))) return candidate;
  }
  return `deleted-${id.slice(-22)}`;
}

/**
 * Deletes the account: personal details are wiped and sign-in stops working. Threads,
 * replies, stories and team posts stay up, shown as "Former student".
 */
export const DELETE = route(
  async ({ req, user }) => {
    await readBody(req, Delete);
    const doc = await User.findOne({ _id: user!.id, deletedAt: null }).lean();
    if (!doc) throw notFound('Your account');
    const id = String(doc._id);

    await User.updateOne(
      { _id: id },
      {
        $set: {
          name: 'Former student',
          handle: await deletedHandle(id),
          emailVerified: null,
          providers: [],
          about: '',
          college: '',
          city: '',
          skills: [],
          bio: '',
          github: '',
          linkedin: '',
          lookingForTeam: false,
          followedCities: [],
          record: [],
          prefs: { reminders: false, digest: false, teamEmails: false },
          deletedAt: new Date(),
        },
        $unset: { email: 1, passwordHash: 1, image: 1 },
      }
    );

    // Private data goes; open team posts close so nobody waits on a reply that won't come.
    await Promise.all([
      SavedEvent.deleteMany({ userId: id }),
      Activity.deleteMany({ userId: id }),
      Notification.deleteMany({ userId: id }),
      AuthToken.deleteMany({ userId: id }),
      DigestSubscriber.deleteMany(doc.email ? { $or: [{ userId: id }, { email: doc.email }] } : { userId: id }),
      TeamPost.updateMany({ authorId: id, open: true }, { $set: { open: false } }),
      TeamRequest.updateMany({ fromUserId: id, status: 'pending' }, { $set: { status: 'withdrawn' } }),
      Invite.updateMany({ fromUserId: id, status: 'pending' }, { $set: { status: 'withdrawn' } }),
    ]);
    console.info(`[account] Deleted account ${id}`);
    return { ok: true };
  },
  { auth: 'required', rate: { limit: 3, windowMs: 60 * 60 * 1000, key: 'delete-account' } }
);
