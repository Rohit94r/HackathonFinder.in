import { z } from 'zod';
import { User } from '@hackathonfinder/db';
import { readBody, route } from '@/server/api';
import { sendPasswordResetEmail } from '@/server/accountEmails';

const Body = z.object({ email: z.string().trim().toLowerCase().email('Add a valid email.') });

/** Emails a reset link. Always answers the same way, so it can't reveal who has an account. */
export const POST = route(
  async ({ req }) => {
    const { email } = await readBody(req, Body);
    const user = await User.findOne({ email, isSample: false }).select('+passwordHash');
    // OAuth-only accounts get a link too: setting a password lets them sign in either way.
    if (user && !user.banned) await sendPasswordResetEmail(user);
    return { ok: true };
  },
  { auth: 'none', rate: { limit: 5, windowMs: 60 * 60 * 1000, key: 'forgot' } }
);
