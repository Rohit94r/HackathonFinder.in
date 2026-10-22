import { z } from 'zod';
import { AuthToken, User } from '@hackathonfinder/db';
import { badRequest, notFound, readBody, route } from '@/server/api';
import { sendEmail, siteUrl } from '@/server/email';
import { checkPassword, hashPassword, passwordProblem } from '@/server/users';

const Body = z.object({
  /** Needed when the account already has a password. */
  current: z.string().max(200).optional(),
  next: z.string().max(200),
});

/** Changes the password, or sets one for an account that only used Google or GitHub so far. */
export const POST = route(
  async ({ req, user }) => {
    const { current, next } = await readBody(req, Body);
    const doc = await User.findOne({ _id: user!.id, deletedAt: null }).select('+passwordHash').lean();
    if (!doc) throw notFound('Your account');
    if (!doc.email) throw badRequest('Your account has no email address, so a password can’t be used to sign in.');

    if (doc.passwordHash) {
      if (!current) throw badRequest('Enter your current password.', { current: 'Enter your current password.' });
      if (!(await checkPassword(current, doc.passwordHash))) {
        throw badRequest('That isn’t your current password.', { current: 'That isn’t your current password.' });
      }
      if (await checkPassword(next, doc.passwordHash)) {
        throw badRequest('Choose a password you haven’t used here.', { next: 'Pick a different password.' });
      }
    }
    const problem = passwordProblem(next);
    if (problem) throw badRequest(problem, { next: problem });

    await User.updateOne({ _id: doc._id }, { $set: { passwordHash: await hashPassword(next) } });
    // Old reset links shouldn't be able to undo this.
    await AuthToken.deleteMany({ userId: doc._id, type: 'reset-password', usedAt: null });
    await sendEmail({
      to: doc.email,
      subject: doc.passwordHash ? 'Your HackathonFinder password was changed' : 'You set a HackathonFinder password',
      text: `Hi ${doc.name.split(' ')[0]},\n\nThe password on your HackathonFinder account was just ${doc.passwordHash ? 'changed' : 'set'}. If this was you, you’re all set.\n\nIf it wasn’t, reset your password right away and check your sign-in methods in settings.`,
      action: { label: 'Reset my password', url: `${siteUrl()}/forgot-password` },
    });
    return { ok: true, hasPassword: true };
  },
  { auth: 'required', rate: { limit: 5, windowMs: 15 * 60 * 1000, key: 'change-password' } }
);
