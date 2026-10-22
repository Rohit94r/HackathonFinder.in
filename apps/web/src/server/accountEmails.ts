import 'server-only';
import type { Types } from '@hackathonfinder/db';
import { sendEmail, siteUrl } from './email';
import { createToken } from './tokens';

const DAY = 24 * 60 * 60 * 1000;

export async function sendVerificationEmail(user: { _id: Types.ObjectId; email?: string; name: string }) {
  if (!user.email) return;
  const token = await createToken('verify-email', user._id, 3 * DAY);
  await sendEmail({
    to: user.email,
    subject: 'Confirm your email for HackathonFinder',
    text: `Hi ${user.name.split(' ')[0]},\n\nConfirm your email so we can send you deadline reminders and team requests. The link works for 3 days.`,
    action: { label: 'Confirm my email', url: `${siteUrl()}/api/auth/verify?token=${token}` },
  });
}

export async function sendPasswordResetEmail(user: { _id: Types.ObjectId; email?: string; name: string }) {
  if (!user.email) return;
  const token = await createToken('reset-password', user._id, 60 * 60 * 1000);
  await sendEmail({
    to: user.email,
    subject: 'Reset your HackathonFinder password',
    text: `Hi ${user.name.split(' ')[0]},\n\nSomeone (hopefully you) asked to reset your password. The link works for 1 hour. If it wasn’t you, ignore this email and your password stays the same.`,
    action: { label: 'Choose a new password', url: `${siteUrl()}/reset-password?token=${token}` },
  });
}
