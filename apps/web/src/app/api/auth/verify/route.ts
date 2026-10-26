import { NextResponse } from 'next/server';
import { User } from '@hackathonfinder/db';
import { route, unauthorized } from '@/server/api';
import { sendVerificationEmail } from '@/server/accountEmails';
import { consumeToken } from '@/server/tokens';
import { grantsAdmin } from '@/server/users';

/** The link in the confirmation email lands here, then goes to the profile. */
export const GET = route(
  async ({ req }) => {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    const userId = token ? await consumeToken('verify-email', token) : null;
    const target = new URL('/profile', req.nextUrl.origin);
    if (!userId) {
      target.searchParams.set('verified', 'expired');
      return NextResponse.redirect(target);
    }
    const doc = await User.findByIdAndUpdate(userId, { $set: { emailVerified: new Date() } }, { new: true }).select('email emailVerified').lean();
    // A confirmed ADMIN_EMAILS address becomes an admin now, not at sign-up.
    if (grantsAdmin(doc)) await User.updateOne({ _id: userId }, { $set: { role: 'admin' } });
    target.searchParams.set('verified', '1');
    return NextResponse.redirect(target);
  },
  { auth: 'none' }
);

/** Sends the confirmation email again. */
export const POST = route(
  async ({ user }) => {
    if (!user) throw unauthorized();
    const doc = await User.findById(user.id);
    if (doc && !doc.emailVerified) await sendVerificationEmail(doc);
    return { ok: true };
  },
  { auth: 'required', rate: { limit: 3, windowMs: 60 * 60 * 1000, key: 'verify-resend' } }
);
