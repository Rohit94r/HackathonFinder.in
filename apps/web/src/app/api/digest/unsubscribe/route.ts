import { NextResponse } from 'next/server';
import { DigestSubscriber } from '@hackathonfinder/db';
import { route } from '@/server/api';

/** One-click unsubscribe from the link in every digest. */
export const GET = route(
  async ({ req }) => {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    const sub = token ? await DigestSubscriber.findOneAndUpdate({ token }, { $set: { unsubscribedAt: new Date() } }) : null;
    return NextResponse.redirect(new URL(`/digest?status=${sub ? 'unsubscribed' : 'invalid'}`, req.nextUrl.origin));
  },
  { auth: 'none' }
);
