import { z } from 'zod';
import { User } from '@hackathonfinder/db';
import { badRequest, notFound, readBody } from '@/server/api';
import { adminRoute, deleteUserAccount, getUserDetail, idParam, moderateUser } from '@/server/admin';

/** Everything about one account: profile, what they created and shared, analytics and a timeline. Never message contents. */
export const GET = adminRoute<{ id: string }>(async ({ params }) => getUserDetail(idParam(params.id, 'That account')));

const Patch = z
  .object({
    role: z.enum(['student', 'organizer', 'admin']).optional(),
    banned: z.boolean().optional(),
    /** With a ban: also hide everything they posted. With an unban: put back what admins hid. */
    content: z.boolean().default(false),
  })
  .strict()
  .refine((v) => v.role !== undefined || v.banned !== undefined, 'Nothing to change.');

/** Change a role, or ban / unban. Banned accounts can't sign in or post. Never yourself, never the last admin. */
export const PATCH = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const body = await readBody(req, Patch);
  return moderateUser(idParam(params.id, 'That account'), body, user);
});

const Delete = z
  .object({
    /** The account's handle, typed to confirm. */
    confirm: z.string().trim().max(40),
    hideContent: z.boolean().default(false),
  })
  .strict();

/** Deletes the account (personal details wiped, sign-in stops), like a student deleting their own. */
export const DELETE = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const id = idParam(params.id, 'That account');
  const { confirm, hideContent } = await readBody(req, Delete);
  const doc = await User.findById(id).select('handle deletedAt').lean();
  if (!doc || doc.deletedAt) throw notFound('That account');
  if (confirm.toLowerCase() !== doc.handle) throw badRequest(`Type ${doc.handle} to confirm.`, { confirm: `Type ${doc.handle} to confirm.` });
  return deleteUserAccount(id, user, hideContent);
});
