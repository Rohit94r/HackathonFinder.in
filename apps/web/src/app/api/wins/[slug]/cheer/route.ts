import { route } from '@/server/api';
import { toggleCheer } from '@/server/wins';

/** Cheer for a story; sending it again takes the cheer back. */
export const POST = route<{ slug: string }>(
  async ({ params, user }) => toggleCheer(user!, params.slug),
  { auth: 'required', rate: { limit: 60, windowMs: 60_000, key: 'cheer' } }
);
