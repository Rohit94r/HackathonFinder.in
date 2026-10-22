import { z } from 'zod';
import { User } from '@hackathonfinder/db';
import { forbidden, notFound, readBody } from '@/server/api';
import { adminRoute, idParam, userRow } from '@/server/admin';
import { isAdminEmail } from '@/server/users';

const Body = z
  .object({
    role: z.enum(['student', 'organizer', 'admin']).optional(),
    banned: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.banned !== undefined, 'Nothing to change.');

/** Change a student's role, or ban / unban them. Banned accounts can't sign in. */
export const PATCH = adminRoute<{ id: string }>(async ({ req, params, user }) => {
  const body = await readBody(req, Body);
  const id = idParam(params.id, 'That account');
  // Keeps at least one way back in: nobody can lock themselves out by accident.
  if (id === user.id && (body.banned || (body.role && body.role !== 'admin'))) {
    throw forbidden('You can’t remove your own admin access or ban yourself.');
  }
  const doc = await User.findById(id);
  if (!doc || doc.deletedAt) throw notFound('That account');
  if (doc.isSample) throw forbidden('Sample students are seeded data and can’t sign in anyway.');
  if (body.role) doc.role = body.role;
  if (body.banned !== undefined) doc.banned = body.banned;
  await doc.save();
  const note =
    body.role && body.role !== 'admin' && isAdminEmail(doc.email)
      ? 'This email is in ADMIN_EMAILS, so it becomes admin again at the next sign-in. Remove it there to make this stick.'
      : '';
  return { user: userRow(doc.toObject()), note };
});
