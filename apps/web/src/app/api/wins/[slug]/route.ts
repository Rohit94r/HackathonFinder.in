import { notFound, route } from '@/server/api';
import { deleteWin, getWin, readWinRequest, updateWin, WinPatchSchema } from '@/server/wins';

type Params = { slug: string };

export const GET = route<Params>(
  async ({ params, user }) => {
    const data = await getWin(params.slug, user);
    if (!data) throw notFound('That story');
    return data;
  },
  { auth: 'optional' }
);

/** The author (or an admin) edits the story. Multipart works too, to replace the cover. */
export const PATCH = route<Params>(
  async ({ req, params, user }) => {
    const { body, cover } = await readWinRequest(req, WinPatchSchema);
    return { win: await updateWin(params.slug, user!, body, cover) };
  },
  { auth: 'required', rate: { limit: 20, windowMs: 10 * 60_000, key: 'win-edit' } }
);

/** Removes the story (author or admin). */
export const DELETE = route<Params>(
  async ({ params, user }) => {
    await deleteWin(params.slug, user!);
    return { ok: true };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60_000, key: 'win-delete' } }
);
