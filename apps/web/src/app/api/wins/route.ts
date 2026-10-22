import { readQuery, route } from '@/server/api';
import { createWin, listWins, NewWinSchema, readWinRequest, WinQuerySchema } from '@/server/wins';

/** Winning stories: filter by result, theme, city, author or words; newest or most cheered first. */
export const GET = route(
  async ({ req, user }) => listWins(readQuery(req, WinQuerySchema), user),
  { auth: 'optional' }
);

/** Share a win. JSON, or multipart with the details as JSON in `data` and an optional `cover` image. */
export const POST = route(
  async ({ req, user }) => {
    const { body, cover } = await readWinRequest(req, NewWinSchema);
    return { win: await createWin(user!, body, cover) };
  },
  { auth: 'required', rate: { limit: 5, windowMs: 60 * 60_000, key: 'win-post' } }
);
