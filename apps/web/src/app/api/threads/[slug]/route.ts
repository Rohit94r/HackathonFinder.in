import { notFound, readBody, route } from '@/server/api';
import { deleteThread, getThread, ThreadPatchSchema, updateThread } from '@/server/community';

type Params = { slug: string };

/** One discussion with its replies, oldest first. */
export const GET = route<Params>(
  async ({ params, user }) => {
    const data = await getThread(params.slug, user);
    if (!data) throw notFound('That discussion');
    return data;
  },
  { auth: 'optional' }
);

/** The author edits title, body or tags (first 24 hours); admins pin or unpin. */
export const PATCH = route<Params>(
  async ({ req, params, user }) => ({ thread: await updateThread(params.slug, user!, await readBody(req, ThreadPatchSchema)) }),
  { auth: 'required', rate: { limit: 20, windowMs: 10 * 60_000, key: 'thread-edit' } }
);

/** Removes the discussion (author or admin). */
export const DELETE = route<Params>(
  async ({ params, user }) => {
    await deleteThread(params.slug, user!);
    return { ok: true };
  },
  { auth: 'required', rate: { limit: 30, windowMs: 60_000, key: 'thread-delete' } }
);
