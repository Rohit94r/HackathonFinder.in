import { z } from 'zod';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import { DigestSubscriber } from '@hackathonfinder/db';
import { readBody, route } from '@/server/api';
import { newDigestToken, sendDigestConfirmation } from '@/server/digest';

const Body = z.object({
  email: z.string().trim().toLowerCase().email('Add a valid email.'),
  cities: z.array(z.enum(CITIES.map((c) => c.slug) as [string, ...string[]])).max(CITIES.length).default([]),
  themes: z.array(z.enum(THEMES.map((t) => t.slug) as [string, ...string[]])).max(THEMES.length).default([]),
});

/** Weekly digest sign-up. Sends a confirmation email first (double opt-in). */
export const POST = route(
  async ({ req, user }) => {
    const body = await readBody(req, Body);
    const existing = await DigestSubscriber.findOne({ email: body.email });
    if (existing?.confirmedAt && !existing.unsubscribedAt) {
      // Only the address's owner may change what a confirmed subscription sends.
      if (user?.email && user.email.toLowerCase() === body.email) {
        existing.cities = body.cities.length ? body.cities : existing.cities;
        existing.themes = body.themes.length ? body.themes : existing.themes;
        await existing.save();
      }
      return { status: 'subscribed' as const };
    }
    const sub =
      existing ??
      new DigestSubscriber({ email: body.email, token: newDigestToken() });
    sub.cities = body.cities;
    sub.themes = body.themes;
    sub.unsubscribedAt = null;
    // Linked to an account only when it's that account's own address.
    if (user && !sub.userId && user.email?.toLowerCase() === body.email) sub.userId = user.id as never;
    await sub.save();
    await sendDigestConfirmation(sub);
    return { status: 'confirm' as const };
  },
  { auth: 'optional', rate: { limit: 5, windowMs: 60 * 60 * 1000, key: 'digest' } }
);
