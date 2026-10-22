import { NextResponse } from 'next/server';
import { DigestSubscriber } from '@hackathonfinder/db';
import { route } from '@/server/api';

/** The link in the confirmation email. */
export const GET = route(
  async ({ req }) => {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    const sub = token ? await DigestSubscriber.findOneAndUpdate({ token }, { $set: { confirmedAt: new Date(), unsubscribedAt: null } }) : null;
    return NextResponse.redirect(new URL(`/digest?status=${sub ? 'confirmed' : 'invalid'}`, req.nextUrl.origin));
  },
  { auth: 'none' }
);
